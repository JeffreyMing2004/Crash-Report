/**
 * AI Analysis Service
 * 使用大语言模型分析 Minecraft 崩溃报告
 */

const OpenAI = require('openai');

function createClient() {
  const config = {
    apiKey: process.env.OPENAI_API_KEY || 'sk-placeholder',
    baseURL: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
    timeout: 120000, // 120秒超时
    maxRetries: 1,
  };
  return new OpenAI(config);
}

function buildSystemPrompt() {
  return `你是一位 Minecraft（我的世界）Java 版崩溃分析专家，精通客户端崩溃和服务器日志分析。

你的任务是根据崩溃报告/服务器日志内容，为用户提供专业、准确、易懂的中文分析。

【客户端崩溃常见错误】
- java.lang.NullPointerException - 空指针异常（Mod 数据异常/Bug）
- java.lang.OutOfMemoryError - 内存不足（分配内存过小或内存泄漏）
- java.lang.ClassNotFoundException / NoClassDefFoundError - 类未找到（Mod 冲突或缺失依赖）
- java.lang.RuntimeException - 运行时异常
- java.lang.IllegalArgumentException - 非法参数（配置错误）
- java.util.ConcurrentModificationException - 并发修改异常（多线程问题）
- java.lang.IllegalStateException - 非法状态异常
- java.lang.NoSuchMethodError - 方法未找到（Mod 版本不兼容）
- java.lang.StackOverflowError - 栈溢出

【Spigot/Paper/Purpur 服务端常见错误】
- java.lang.NullPointerException - 插件数据为 null 或事件处理不当
- java.lang.OutOfMemoryError - 服务器内存不足，需增加 -Xmx 参数
- java.io.IOException: 文件名、目录名或卷标语法不正确 - 路径编码问题
- java.net.BindException: Address already in use - 端口被占用
- java.lang.NoClassDefFoundError - 插件缺少依赖库
- org.bukkit.plugin.InvalidPluginException - 插件不兼容
- java.lang.NoSuchMethodError - 插件 API 版本不匹配（用错 Spigot/Paper API 版本）
- Can't keep up! Is the server overloaded? - TPS 过低，服务器负载过高
- java.sql.SQLException - 数据库连接失败
- java.io.EOFException / Packet related - 网络连接问题
- Corrupted chunk - 区块损坏

请以 JSON 格式返回分析结果：
{
  "summary": "用1-2句话概括崩溃原因",
  "rootCause": "详细分析崩溃的根本原因",
  "solutions": ["解决方案1", "解决方案2", "解决方案3"],
  "relatedMods": ["可能相关的Mod或插件名称"],
  "severity": "critical|high|medium|low",
  "estimatedFixTime": "预估修复所需时间",
  "technicalDetails": "技术层面解释（可选）"
}

注意：
- 所有内容使用中文
- 解决方案要具体可行，给出操作步骤和具体命令
- 对于插件问题：指出插件名，建议更新或替换
- 对于内存问题：给出具体的 -Xmx 和 -Xms 建议值
- 对于配置问题：指出具体配置项和修改方法
- 对于 TPS/性能问题：给出具体的优化建议（timings/spark 分析）
- severity: critical=服务器完全无法启动，high=频繁崩溃/TPS极低，medium=偶尔报错，low=可忽略的警告`;
}

function buildUserPrompt(parsedReport) {
  const {
    reportType, serverType, description, errorType, errorMessage,
    stackTrace, mods, plugins, errors, warnings,
    time, javaVersion, memory, affectedLevel, systemDetails,
  } = parsedReport;

  // 根据报告类型选择合适的开头
  if (reportType === 'server_log') {
    let prompt = '请分析以下 Minecraft 服务器日志：\n\n';
    prompt += `服务器类型：${serverType || '未知'}\n`;

    if (description) prompt += `主要错误：${description}\n`;
    if (errorType) prompt += `错误类型：${errorType}\n`;
    if (errorMessage) prompt += `错误信息：${errorMessage}\n`;
    if (time) prompt += `时间：${time}\n`;
    if (javaVersion) prompt += `Java 版本：${javaVersion}\n`;
    if (memory.heap) prompt += `堆内存：${memory.heap}\n`;

    if (systemDetails && Object.keys(systemDetails).length > 0) {
      prompt += '\n系统信息：\n';
      for (const [key, value] of Object.entries(systemDetails)) {
        prompt += `  ${key}: ${value}\n`;
      }
    }

    if (plugins && plugins.length > 0) {
      prompt += `\n已加载插件（共 ${plugins.length} 个）：\n`;
      for (const p of plugins.slice(0, 30)) {
        prompt += `  - ${p.name}${p.version ? ' v' + p.version : ''}\n`;
      }
      if (plugins.length > 30) prompt += `  ... 还有 ${plugins.length - 30} 个插件\n`;
    }

    if (errors && errors.length > 0) {
      prompt += `\n日志中的错误（共 ${errors.length} 处）：\n`;
      for (const err of errors.slice(0, 5)) {
        prompt += `  [ERROR] ${err.message}\n`;
      }
    }

    if (warnings && warnings.length > 0) {
      prompt += `\n日志中的警告（共 ${warnings.length} 处，前5条）：\n`;
      for (const w of warnings.slice(0, 5)) {
        prompt += `  [WARN] ${w}\n`;
      }
    }

    if (stackTrace && stackTrace.length > 0) {
      prompt += '\n堆栈跟踪（关键部分）：\n';
      prompt += stackTrace.slice(0, 40).join('\n');
      if (stackTrace.length > 40) prompt += `\n... 还有 ${stackTrace.length - 40} 行`;
    }

    return prompt;
  }

  // 客户端崩溃报告 / 通用日志
  let prompt = '请分析以下 Minecraft 崩溃报告：\n\n';

  if (reportType === 'generic_log') {
    prompt = '请分析以下日志文件：\n\n';
  }

  if (description) prompt += `崩溃描述：${description}\n`;
  if (errorType) prompt += `错误类型：${errorType}\n`;
  if (errorMessage) prompt += `错误信息：${errorMessage}\n`;
  if (time) prompt += `发生时间：${time}\n`;
  if (javaVersion) prompt += `Java 版本：${javaVersion}\n`;
  if (memory.heap) prompt += `堆内存：${memory.heap}\n`;
  if (memory.allocated) prompt += `已分配内存：${memory.allocated}\n`;
  if (memory.free) prompt += `可用内存：${memory.free}\n`;
  if (affectedLevel) prompt += `受影响维度：${affectedLevel}\n`;

  if (systemDetails && Object.keys(systemDetails).length > 0) {
    prompt += '\n系统信息：\n';
    for (const [key, value] of Object.entries(systemDetails)) {
      prompt += `  ${key}: ${value}\n`;
    }
  }

  if (mods && mods.length > 0) {
    prompt += `\n已加载 Mod 列表（共 ${mods.length} 个）：\n`;
    for (const mod of mods.slice(0, 50)) {
      prompt += `  - ${mod.name} (${mod.version})\n`;
    }
    if (mods.length > 50) prompt += `  ... 还有 ${mods.length - 50} 个 Mod\n`;
  }

  if (plugins && plugins.length > 0) {
    prompt += `\n插件列表（共 ${plugins.length} 个）：\n`;
    for (const p of plugins.slice(0, 20)) {
      prompt += `  - ${p.name}${p.version ? ' v' + p.version : ''}\n`;
    }
  }

  if (stackTrace && stackTrace.length > 0) {
    prompt += '\n堆栈跟踪（关键部分）：\n';
    const truncated = stackTrace.slice(0, 40);
    prompt += truncated.join('\n');
    if (stackTrace.length > 40) prompt += `\n... 还有 ${stackTrace.length - 40} 行`;
  }

  return prompt;
}

async function analyzeReport(parsedReport) {
  const client = createClient();
  const model = process.env.AI_MODEL || 'gpt-4o-mini';

  const response = await client.chat.completions.create({
    model,
    messages: [
      { role: 'system', content: buildSystemPrompt() },
      { role: 'user', content: buildUserPrompt(parsedReport) },
    ],
    temperature: 0.3,
    max_tokens: 4096,
  });

  const message = response.choices[0]?.message || {};

  // 兼容多种模型响应格式
  // 普通模型: message.content
  // 推理模型(DeepSeek-R1风格): message.reasoning_content + message.content
  // 部分推理模型: message.reasoning
  let rawContent = message.content || message.reasoning_content || message.reasoning || '';

  if (!rawContent) {
    throw new Error('AI 分析返回空结果（当前模型可能为推理模型，内容在其他字段中）');
  }

  // 对于推理模型，reasoning 中可能包含思考过程，
  // 尝试提取最后的 JSON 块
  const jsonMatch = rawContent.match(/\{[\s\S]*\}/g);
  if (jsonMatch) {
    // 取最后一个 JSON 块（推理模型的思考过程可能也包含 { } ）
    const lastJson = jsonMatch[jsonMatch.length - 1];
    try {
      return JSON.parse(lastJson);
    } catch {
      // 继续尝试其他
    }
  }

  try {
    return JSON.parse(rawContent);
  } catch {
    throw new Error('AI 返回格式异常，无法解析为 JSON');
  }
}

module.exports = { analyzeReport };
