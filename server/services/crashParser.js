/**
 * Minecraft Crash Report Parser
 * 解析 Minecraft 崩溃报告，提取关键信息
 */

function parseCrashReport(content) {
  const result = {
    raw: content,
    description: null,
    errorType: null,
    errorMessage: null,
    time: null,
    javaVersion: null,
    memory: {},
    mods: [],
    stackTrace: [],
    affectedLevel: null,
    systemDetails: {},
    keySections: [],
  };

  // 提取描述行
  const descMatch = content.match(/Description:\s*(.+)/i);
  if (descMatch) {
    result.description = descMatch[1].trim();
    // 解析错误类型
    const errTypeMatch = result.description.match(
      /([\w.]+(?:Exception|Error|Throwable))(?::\s*(.*))?/
    );
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

  const heapMatch = content.match(
    /Heap(?: memory)?:\s*([\d.]+)\s*(MB|GB|KB)/i
  );
  if (heapMatch) {
    result.memory.heap = `${heapMatch[1]} ${heapMatch[2]}`;
  }

  const allocatedMatch = content.match(
    /Allocated(?: memory)?:\s*([\d.]+)\s*(MB|GB|KB)/i
  );
  if (allocatedMatch) {
    result.memory.allocated = `${allocatedMatch[1]} ${allocatedMatch[2]}`;
  }

  const freeMatch = content.match(/Free(?: memory)?:\s*([\d.]+)\s*(MB|GB|KB)/i);
  if (freeMatch) {
    result.memory.free = `${freeMatch[1]} ${freeMatch[2]}`;
  }

  // 提取堆栈跟踪
  result.stackTrace = extractStackTrace(content);

  // 提取 Mod 列表
  result.mods = extractMods(content);

  // 提取影响的维度/世界
  const levelMatch = content.match(/Affected level\s*[-:]\s*(.+)/i);
  if (levelMatch) result.affectedLevel = levelMatch[1].trim();

  // 提取关键章节（用于 AI 分析上下文）
  result.keySections = extractKeySections(content);

  // 系统详情
  result.systemDetails = extractSystemDetails(content);

  return result;
}

function extractStackTrace(content) {
  const lines = [];
  const stackStartPatterns = [
    /at\s+[\w.$]+\.[\w<>$]+\([\w.]+\.[\w]+:\d+\)/,
    /at\s+[\w.$]+\.[\w<>$]+\(Native Method\)/,
    /Caused by:/,
    /\.\.\. \d+ more/,
  ];

  let inStack = false;
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (
      trimmed.startsWith('at ') ||
      trimmed.startsWith('Caused by:') ||
      (inStack && trimmed.match(/^\s*\.\.\. \d+ more/))
    ) {
      inStack = true;
      lines.push(trimmed);
    } else if (inStack && trimmed === '') {
      inStack = false;
    }
  }

  return lines;
}

function extractMods(content) {
  const mods = [];
  // 尝试多种 Mod 列表格式
  const modSectionPatterns = [
    /Modify the command tree:[\s\S]*?((?:[\w-]+:\d+[\s\S]*?)+?)(?=\n\n|\n\s*\n|$)/i,
    /-- Mod List --[\s\S]*?((?:[\w-]+\s+\|[\s\S]*?)+?)(?=\n\n|\n\s*\n|$)/i,
    /Mod List:[\s\S]*?((?:.{10,200}\n)+?)(?=\n\n|$)/i,
    /Loaded[ _]Mods?:[\s\S]*?((?:\s{2,}.+\n)+)/i,
  ];

  // 通用正则匹配 modname:version 格式
  const genericModRegex = /([\w-]+)\s*[:=]\s*([\d.]+[-\w.]*)/g;
  let match;
  while ((match = genericModRegex.exec(content)) !== null) {
    const name = match[1];
    const version = match[2];
    if (
      name.length > 1 &&
      !['at', 'by', 'in', 'on', 'is', 'if', 'or', 'to'].includes(
        name.toLowerCase()
      ) &&
      !mods.find((m) => m.name === name)
    ) {
      mods.push({ name, version });
    }
  }

  // 限制 mod 数量，避免过多
  return mods.slice(0, 200);
}

function extractKeySections(content) {
  const sections = [];
  const sectionRegex = /^(--+\s*[^-]+\s*--+)$/gm;
  const lines = content.split('\n');
  let currentSection = null;
  let currentContent = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.match(/^--+\s*.+\s*--+$/)) {
      if (currentSection && currentContent.length > 0) {
        sections.push({
          title: currentSection,
          content: currentContent.join('\n').trim(),
        });
      }
      currentSection = trimmed.replace(/^-+\s*|\s*-+$/g, '');
      currentContent = [];
    } else if (currentSection) {
      currentContent.push(line);
    }
  }

  if (currentSection && currentContent.length > 0) {
    sections.push({
      title: currentSection,
      content: currentContent.join('\n').trim(),
    });
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
