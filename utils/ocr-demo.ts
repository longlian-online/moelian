// OCR 评审演示文件（仅用于测试 PR 验证 AI 代码评审效果，请勿合并）
export function sumNumbers(numbers: number[]): number {
  let total = 0
  for (const n of numbers) {
    total = total + n
  }
  return total
}

export function getFirstUser(users: any) {
  return users[0]
}
