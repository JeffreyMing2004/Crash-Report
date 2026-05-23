/**
 * Minecraft 崩溃报告 & 服务器日志解析器
 * 支持：
 *   - 客户端崩溃报告 (crash-reports/*.txt)
 *   - Spigot/Paper/Purpur 服务器日志
 *   - Forge/Fabric/NeoForge 服务端日志
 *   - 通用 Java 异常日志
 */

function parseCrashReport(content) {
  // 检测报告类型
  const reportType = detectReportType(content);

  const result = {
    raw: content,
    reportType, // 'crash_report' | 'server_log' | 'generic_log'
    serverType: null, // 'vanilla' | 'spigot' | 'paper' | 'purpur' | 'forge' | 'fabric'
    description: null,
    errorType: null,
    errorMessage: null,
    time: null,
    javaVersion: null,
    memory: {},
    mods: [],
    plugins: [],
    stackTrace: [],
    affectedLevel: null,
    systemDetails: {},
    keySections: [],
    errors: [],     // 服务器日志中的多个错误
    warnings: [],   // 服务器日志中的警告
    startupInfo: {}, // 服务器启动信息
  };

  switch (reportType) {
    case 'crash_report':
      parseClientCrashReport(content, result);
      break;
    case 'server_log':
      parseServerLog(content, result);
      break;
    default:
      parseGenericLog(content, result);
  }

  return result;
}

// ======================== 类型检测 ========================

function detectReportType(content) {
  const head = content.slice(0, 3000);

  // 客户端崩溃报告特征
  if (/----\s*Minecraft\s*Crash\s*Report\s*----/i.test(head)) return 'crash_report';
  if (/\/\/\s*(?:Oops|Hey|Don't be sad)/i.test(head)) return 'crash_report';

  // 服务器日志特征（含时间戳日志格式）
  const serverIndicators = [
    /\[\d{2}:\d{2}:\d{2}\]\s*\[.*(?:Server thread|main|INFO)\]/,
    /Starting minecraft server/i,
    /This server is running (?:Paper|Purpur|Pufferfish|Spigot|CraftBukkit)/i,
    /Loading libraries/i,
    /Done \(\d+\.\d+s\)!/i,
    /Environment:\s*(?:authlib|bungeecord)/i,
    // Paper/Spigot 错误片段
    /org\.bukkit\./i,
    /net\.minecraft\.server\./i,
    /\[.*\s(?:ERROR|WARN)\]:.*(?:plugin|server|world|chunk|player)/i,
  ];

  for (const pattern of serverIndicators) {
    if (pattern.test(head)) return 'server_log';
  }

  return 'generic_log';
}

// ======================== 客户端崩溃报告 ========================

function parseClientCrashReport(content, result) {
  // 提取描述行
  const descMatch = content.match(/Description:\s*(.+)/i);
  if (descMatch) {
    result.description = descMatch[1].trim();
    const errTypeMatch = result.description.match(/([\w.]+(?:Exception|Error|Throwable))(?::\s*(.*))?/);
    if (errTypeMatch) {
      result.errorType = errTypeMatch[1];
      result.errorMessage = (errTypeMatch[2] || '').trim();
    }
  }

  // 提取时间
  const timeMatch = content.match(/Time:\s*(.+)/i);
  if (timeMatch) result.time = timeMatch[1].trim();

  // 提取 Java 版本
  const javaMatch = content.match(/Java(?: VM)? Version:\s*(.+)/i);
  if (javaMatch) result.javaVersion = javaMatch[1].trim();

  // 提取内存信息
  const memTypeMatch = content.match(/Memory:\s*(.+)/i);
  if (memTypeMatch) result.memory.raw = memTypeMatch[1].trim();

  const heapMatch = content.match(/Heap(?: memory)?:\s*([\d.]+)\s*(MB|GB|KB)/i);
  if (heapMatch) result.memory.heap = `${heapMatch[1]} ${heapMatch[2]}`;

  const allocatedMatch = content.match(/Allocated(?: memory)?:\s*([\d.]+)\s*(MB|GB|KB)/i);
  if (allocatedMatch) result.memory.allocated = `${allocatedMatch[1]} ${allocatedMatch[2]}`;

  const freeMatch = content.match(/Free(?: memory)?:\s*([\d.]+)\s*(MB|GB|KB)/i);
  if (freeMatch) result.memory.free = `${freeMatch[1]} ${freeMatch[2]}`;

  // 堆栈
  result.stackTrace = extractStackTrace(content);

  // Mod 列表
  result.mods = extractMods(content);

  // 影响维度
  const levelMatch = content.match(/Affected level\s*[-:]\s*(.+)/i);
  if (levelMatch) result.affectedLevel = levelMatch[1].trim();

  // 章节
  result.keySections = extractKeySections(content);

  // 系统详情
  result.systemDetails = extractSystemDetails(content);

  // 服务端类型
  if (content.includes('Forge') || content.includes('forge')) result.serverType = 'forge';
  else if (content.includes('Fabric')) result.serverType = 'fabric';
}

// ======================== 服务器日志解析 ========================

function parseServerLog(content, result) {
  const lines = content.split('\n');

  // 检测服务端类型
  if (/This server is running Paper/i.test(content)) result.serverType = 'paper';
  else if (/This server is running Purpur/i.test(content)) result.serverType = 'purpur';
  else if (/This server is running Pufferfish/i.test(content)) result.serverType = 'pufferfish';
  else if (/This server is running (?:Spigot|CraftBukkit)/i.test(content)) result.serverType = 'spigot';
  else if (/forgeserver|net\.minecraftforge/i.test(content)) result.serverType = 'forge';
  else if (/fabric-loader/i.test(content)) result.serverType = 'fabric';
  else result.serverType = 'vanilla';

  // === 提取启动信息 ===
  for (const line of lines) {
    // 服务器版本
    const verMatch = line.match(/Starting minecraft server version\s*(.+)/i);
    if (verMatch) result.systemDetails.minecraftVersion = verMatch[1].trim();

    // Paper/Spigot 版本
    const paperMatch = line.match(/This server is running\s*(.+)/i);
    if (paperMatch) result.systemDetails.serverSoftware = paperMatch[1].trim();

    // Java 版本
    const javaMatch = line.match(/Java\s*(?:Version)?:?\s*(.+)/i);
    if (javaMatch && !result.javaVersion) result.javaVersion = javaMatch[1].trim();

    // 内存/GC
    const memMatch = line.match(/(?:Max|Maximum|Heap)\s*(?:memory|Mem)?\s*:?\s*([\d,]+)\s*(MB|GB|KB)/i);
    if (memMatch) result.memory.heap = `${memMatch[1].replace(/,/g, '')} ${memMatch[2]}`;

    // JVM 参数
    const jvmMatch = line.match(/JVM (?:Flags|Args|Arguments)\s*:?\s*(.+)/i);
    if (jvmMatch) result.systemDetails.jvmFlags = jvmMatch[1].trim();

    // 操作系统
    const osMatch = line.match(/OS\s*:?\s*(.+)/i);
    if (osMatch) result.systemDetails.operatingSystem = osMatch[1].trim();

    // 插件列表
    const pluginMatch = line.match(/Plugins\s*\(\d+\):\s*(.+)/i);
    if (pluginMatch) {
      result.plugins = parsePluginList(pluginMatch[1]);
    }
    // 单个插件加载 - Paper格式: [PluginName] Loading PluginName v1.0
    const paperPluginMatch = line.match(/\[(\w+)\]\s+[Ll]oading \1\s*(?:version\s*)?v?([\d.]+[-\w.]*)/i);
    if (paperPluginMatch) {
      if (!result.plugins.find(p => p.name === paperPluginMatch[1])) {
        result.plugins.push({ name: paperPluginMatch[1], version: paperPluginMatch[2] });
      }
    }
    // 通用插件加载
    const singlePlugin = line.match(/\[.*]\s*(?:\[.*]\s*)?[Ll]oading (?:plugin:?\s*)?(.+?)(?:\s*v?([\d.]+[-\w.]*))?\s*$/i);
    if (singlePlugin && !paperPluginMatch) {
      const name = singlePlugin[1].trim();
      const version = singlePlugin[2] || '';
      if (name.length < 50 && !result.plugins.find(p => p.name === name)) {
        result.plugins.push({ name, version });
      }
    }
  }

  // === 提取错误和堆栈 ===
  result.errors = [];
  result.warnings = [];
  const allStackLines = [];
  let currentError = null;
  let inStack = false;

  for (const line of lines) {
    const trimmed = line.trim();

    // 遇到新的时间戳日志行时，重置堆栈上下文
    // 服务器日志中，日志行会打断连续的堆栈跟踪
    if (inStack && /^\[[\d:]+\s/.test(trimmed)) {
      inStack = false;
    }

    // 检测错误日志行 - 支持多种格式:
    // [HH:MM:SS ERROR]: message (Paper/Spigot: level 在时间戳括号内)
    // [HH:MM:SS] [thread/ERROR]: message
    const errorLogMatch = trimmed.match(/^\[.*\s(?:ERROR|FATAL)\]:\s*(.+)/i)   // Paper style
      || trimmed.match(/^\[.*\]\s*\[.*(?:ERROR|FATAL).*\]:\s*(.+)/i);          // Vanilla/Forge style
    if (errorLogMatch && !inStack) {
      if (currentError) {
        result.errors.push(currentError);
      }
      currentError = { message: errorLogMatch[1].trim(), stackTrace: [] };

      // 从消息中提取异常类型
      const excMatch = currentError.message.match(/([\w.]+(?:Exception|Error|Throwable))/);
      if (excMatch && !result.errorType) {
        result.errorType = excMatch[1];
        result.errorMessage = currentError.message;
        result.description = currentError.message;
      }

      // 时间戳
      const tsMatch = line.match(/^\[(\d{2}:\d{2}:\d{2})\]/);
      if (tsMatch && !result.time) result.time = tsMatch[1];

      continue;
    }

    // WARN 日志 - 支持多种格式
    const warnMatch = trimmed.match(/^\[.*\sWARN\]:\s*(.+)/i)             // Paper style
      || trimmed.match(/^\[.*\]\s*\[.*WARN.*\]:\s*(.+)/i);                // Vanilla style
    if (warnMatch && !inStack) {
      result.warnings.push(warnMatch[1].trim());
      continue;
    }

    // 堆栈帧
    if (trimmed.startsWith('at ') || trimmed.startsWith('Caused by:')) {
      inStack = true;
      allStackLines.push(trimmed);
      if (currentError) currentError.stackTrace.push(trimmed);
      continue;
    }

    // 异常类名行（不在 [时间] 格式中）
    if (!trimmed.startsWith('[') && /^[\w.]+(?:Exception|Error|Throwable)/.test(trimmed)) {
      inStack = true;
      allStackLines.push(trimmed);

      // 提取主错误类型
      const excMatch = trimmed.match(/([\w.]+(?:Exception|Error|Throwable))(?::?\s*(.*))?/);
      if (excMatch) {
        if (!result.errorType) {
          result.errorType = excMatch[1];
          result.errorMessage = (excMatch[2] || '').trim();
          result.description = trimmed;
        }
      }
      continue;
    }

    if (trimmed.match(/^\s*\.\.\.\s*\d+\s*more/)) {
      allStackLines.push(trimmed);
      if (currentError) currentError.stackTrace.push(trimmed);
      continue;
    }

    if (inStack && trimmed === '') {
      inStack = false;
    }
  }

  if (currentError) result.errors.push(currentError);
  result.stackTrace = allStackLines;

  // 限制错误数量
  result.errors = result.errors.slice(0, 10);
  result.warnings = result.warnings.slice(0, 20);

  // 提取时间（从日志前缀）
  if (!result.time) {
    const firstTs = content.match(/\[(\d{2}:\d{2}:\d{2})\]/);
    if (firstTs) result.time = firstTs[1];
  }

  // Mod 列表（Forge 服务器）
  if (result.serverType === 'forge') {
    result.mods = extractMods(content);
  }

  // 系统信息
  result.systemDetails = extractSystemDetails(content);
}

// ======================== 通用日志解析 ========================

function parseGenericLog(content, result) {
  // 检测是否含有服务器日志特征（时间戳 ERROR/WARN 格式）
  const hasTimestampLog = /^\[[\d:]+\s(?:ERROR|WARN|INFO)\]/.test(content.trim());

  // 如果看起来像服务器日志片段，使用 server log 解析
  if (hasTimestampLog || /at org\.bukkit\./.test(content) || /at net\.minecraft\.server\./.test(content)) {
    return parseServerLog(content, result);
  }

  // 从内容中尽可能提取信息
  const excLines = [];
  const errors = [];
  const warnings = [];
  for (const line of content.split('\n')) {
    const trimmed = line.trim();

    // ERROR/WARN 日志行
    const errorMatch = trimmed.match(/^\[.*\s(?:ERROR|FATAL)\]:\s*(.+)/i);
    if (errorMatch) {
      errors.push({ message: errorMatch[1].trim(), stackTrace: [] });
      continue;
    }
    const warnMatch = trimmed.match(/^\[.*\sWARN\]:\s*(.+)/i);
    if (warnMatch) {
      warnings.push(warnMatch[1].trim());
      continue;
    }

    // 异常类名
    if (/^[\w.]+(?:Exception|Error|Throwable)/.test(trimmed)) {
      excLines.push(trimmed);
      const excMatch = trimmed.match(/([\w.]+(?:Exception|Error|Throwable))(?::?\s*(.*))?/);
      if (excMatch && !result.errorType) {
        result.errorType = excMatch[1];
        result.errorMessage = (excMatch[2] || '').trim();
        result.description = trimmed;
      }
    }
    if (trimmed.startsWith('at ') || trimmed.startsWith('Caused by:')) {
      excLines.push(trimmed);
    }
  }
  result.stackTrace = excLines;
  result.errors = errors;
  result.warnings = warnings;

  // 尝试从日志中提取通用信息
  result.javaVersion = extractJavaVersion(content);
  result.systemDetails = extractSystemDetails(content);
  result.mods = extractMods(content);

  // 如果完全没提取到有效信息
  if (!result.errorType && excLines.length === 0 && errors.length === 0) {
    result.description = content.slice(0, 500).trim();
  }
}

// ======================== 共享工具函数 ========================

function parsePluginList(pluginStr) {
  const plugins = [];
  // 格式: PluginName v1.0, AnotherPlugin, YetAnother v2.3
  const parts = pluginStr.split(',').map(s => s.trim());
  for (const part of parts) {
    // 尝试匹配 "Name version" 或 "Name"
    const match = part.match(/^(.+?)(?:\s+v?([\d.]+[-\w.]*))?$/);
    if (match) {
      plugins.push({
        name: match[1].trim(),
        version: match[2] || '',
      });
    }
  }
  return plugins;
}

function extractJavaVersion(content) {
  const patterns = [
    /Java\s*(?:VM)?\s*Version:?\s*(.+)/i,
    /Java:\s*(.+)/i,
    /openjdk version "(.+)"/i,
    /java version "(.+)"/i,
    /JDK\s*(\d+)/i,
  ];
  for (const p of patterns) {
    const m = content.match(p);
    if (m) return m[1].trim();
  }
  return null;
}

function extractStackTrace(content) {
  const lines = [];
  let inStack = false;

  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (trimmed.startsWith('at ') || trimmed.startsWith('Caused by:')) {
      inStack = true;
      lines.push(trimmed);
    } else if (inStack && trimmed.match(/^\s*\.\.\. \d+ more/)) {
      lines.push(trimmed);
    } else if (inStack && trimmed === '') {
      inStack = false;
    }
  }
  return lines;
}

function extractMods(content) {
  const mods = [];
  const genericModRegex = /([\w-]+)\s*[:=]\s*([\d.]+[-\w.]*)/g;
  let match;
  while ((match = genericModRegex.exec(content)) !== null) {
    const name = match[1];
    const version = match[2];
    if (
      name.length > 1 &&
      !['at', 'by', 'in', 'on', 'is', 'if', 'or', 'to', 'and', 'the', 'of',
        'version', 'time', 'server', 'world', 'player', 'java'].includes(name.toLowerCase()) &&
      !mods.find((m) => m.name === name)
    ) {
      mods.push({ name, version });
    }
  }
  return mods.slice(0, 200);
}

function extractKeySections(content) {
  const sections = [];
  const lines = content.split('\n');
  let currentSection = null;
  let currentContent = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.match(/^--+\s*.+\s*--+$/)) {
      if (currentSection && currentContent.length > 0) {
        sections.push({ title: currentSection, content: currentContent.join('\n').trim() });
      }
      currentSection = trimmed.replace(/^-+\s*|\s*-+$/g, '');
      currentContent = [];
    } else if (currentSection) {
      currentContent.push(line);
    }
  }
  if (currentSection && currentContent.length > 0) {
    sections.push({ title: currentSection, content: currentContent.join('\n').trim() });
  }
  return sections;
}

function extractSystemDetails(content) {
  const details = {};
  const detailPatterns = [
    { key: 'minecraftVersion', pattern: /Minecraft Version:\s*(.+)/i },
    { key: 'operatingSystem', pattern: /Operating System[^:]*:\s*(.+)/i },
    { key: 'cpuInfo', pattern: /CPU[^:]*:\s*(.+)/i },
    { key: 'jvmFlags', pattern: /JVM Flags[^:]*:\s*(.+)/i },
    { key: 'launcher', pattern: /Launched(?: Version)?[^:]*:\s*(.+)/i },
    { key: 'gameDirectory', pattern: /Game Directory[^:]*:\s*(.+)/i },
  ];

  for (const { key, pattern } of detailPatterns) {
    const match = content.match(pattern);
    if (match) details[key] = match[1].trim();
  }
  return details;
}

module.exports = { parseCrashReport };
