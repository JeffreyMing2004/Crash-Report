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
  return `你是一位 Minecraft（我的世界）Java 版崩溃分析专家。你的任务是根据崩溃报告内容，
为用户提供专业、准确、易懂的中文分析。

崩溃报告中常见的错误类型包括但不限于：
- java.lang.NullPointerException - 空指针异常
- java.lang.OutOfMemoryError - 内存不足
- java.lang.ClassNotFoundException / NoClassDefFoundError - 类未找到（通常由 Mod 冲突或缺失引起）
- java.lang.RuntimeException - 运行时异常
- java.lang.IllegalArgumentException - 非法参数
- java.util.ConcurrentModificationException - 并发修改异常
- java.lang.IllegalStateException - 非法状态异常
- java.lang.NoSuchMethodError - 方法未找到（Mod 版本不兼容）
- java.lang.StackOverflowError - 栈溢出

请以 JSON 格式返回分析结果，格式如下：
{
  "summary": "用1-2句话概括崩溃原因",
  "rootCause": "详细分析崩溃的根本原因",
  "solutions": ["解决方案1", "解决方案2", "解决方案3"],
  "relatedMods": ["可能相关的Mod名称"],
  "severity": "critical|high|medium|low",
  "estimatedFixTime": "预估修复所需时间（如5分钟、30分钟等）",
  "technicalDetails": "技术层面解释（可选，面向有经验的用户）"
}

注意：
- 所有内容使用中文
- 解决方案要具体可行，给出操作步骤
- 如果涉及特定 Mod，明确指出 Mod 名称和版本要求
- severity 根据崩溃影响判断：critical=游戏完全无法启动，high=频繁崩溃，medium=偶尔崩溃，low=可忽略
- 对于常见的 Forge/Fabric Mod 问题，给出具体的 Mod 兼容性建议`;
}

function buildUserPrompt(parsedReport) {
  const { description, errorType, errorMessage, stackTrace, mods, time, javaVersion, memory, affectedLevel, systemDetails } = parsedReport;

  let prompt = '请分析以下 Minecraft 崩溃报告：\n\n';

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
    if (mods.length > 50) {
      prompt += `  ... 还有 ${mods.length - 50} 个 Mod 未显示\n`;
    }
  }

  if (stackTrace && stackTrace.length > 0) {
    prompt += '\n堆栈跟踪（关键部分）：\n';
    const truncated = stackTrace.slice(0, 40);
    prompt += truncated.join('\n');
    if (stackTrace.length > 40) {
      prompt += `\n... 还有 ${stackTrace.length - 40} 行堆栈信息`;
    }
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
