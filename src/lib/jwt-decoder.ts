// jwt_decoder.ts
export function parseJwt(token: string): void {
    try {
        // Split the token into its parts
        const [headerBase64, payloadBase64] = token.split('.');

        // Decode Base64 to strings
        const header = JSON.parse(atob(headerBase64));
        const payload = JSON.parse(atob(payloadBase64));

        // Log to the console
        console.log('Header:', header);
        console.log('Payload:', payload);
    } catch (error) {
        console.error('Invalid token format or decoding error:', error);
    }
}

export function getCookieValue(cookieName: string): string | null {
    const cookies = document.cookie.split('; ');

    // Find the specific cookie by its name
    const cookie = cookies.find(row => row.startsWith(`${cookieName}=`));
    return cookie ? cookie.split('=')[1] : null;
}
