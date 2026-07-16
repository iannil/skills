// skills/engineer-next/references/resume-logic.js
// 纯函数单一真源：项目接续点检测。无 fs / 无 I/O。
// 由 tests/test-resume.test.js 守护。与 engineer-job/references/detection-logic.js 同构。

// 外来项目代码体量评估（场景 6a/6b 分界）。
// 统计时由 CLI 忽略 node_modules/.git/target/dist/build/.venv 等依赖目录。
function assessCodeVolume(stats) {
  const files = (stats && stats.sourceFiles) || 0
  const loc = (stats && stats.totalLoc) || 0
  return (files >= 10 || loc >= 500) ? 'substantial' : 'near-empty'
}

// detectResumePoint 在 Task 2 实现；此处先只导出 assessCodeVolume，
// 避免 exports 引用未定义符号导致模块加载即抛 ReferenceError。
module.exports = { assessCodeVolume }
