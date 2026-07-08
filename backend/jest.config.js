/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  // 1. tests 폴더 안의 테스트 파일만 실행
  testMatch: ["**/tests/**/*.test.ts"], 
  // 2. ts, js 확장자 모두 인식
  moduleFileExtensions: ["ts", "js"], 
  // 3. uuid 패키지 ESM 충돌 방지 (무시하지 말고 변환할 것)
  transformIgnorePatterns: ["node_modules/(?!uuid)"], 
};