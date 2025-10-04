/**
 * 디버그 메세지 출력 유틸리티
 * 개발 환경에서만 활성화 (오류 제외)
 */
export class Debug {
    // 개발 환경인지 여부
    private static isDevelopment = process.env.NODE_ENV === 'development';
    
    /**
     * 디버그 메시지 출력
     * @param message 내용
     * @param args 추가 정보
     */
    public static log(message: string, ...args: any[]) {
        if (this.isDevelopment) {
            console.log(`[DEBUG] ${message}`, ...args);
        }
    }
    
    /**
     * 경고 메시지 출력
     * @param message 내용
     * @param args 추가 정보
     */
    public static warn(message: string, ...args: any[]) {
        if (this.isDevelopment) {
            console.warn(`[!] ${message}`, ...args);
        }
    }
    
    /**
     * 에러 메시지 출력
     * @param message 내용
     * @param args 추가 정보
     */
    public static error(message: string, ...args: any[]) {
        // 에러는 항상 출력되도록 설정
        console.error(`[ERROR] ${message}`, ...args);
    }
}