export function adjustBrightness(col: string, amt: number) {
    if (!col) return '#3b82f6';
    let usePound = false;
    if (col[0] == "#") {
        col = col.slice(1);
        usePound = true;
    }
    let num = parseInt(col, 16);
    let r = (num >> 16) + amt;
    if (r > 255) r = 255; else if (r < 0) r = 0;
    let b = ((num >> 8) & 0x00FF) + amt;
    if (b > 255) b = 255; else if (b < 0) b = 0;
    let g = (num & 0x0000FF) + amt;
    if (g > 255) g = 255; else if (g < 0) g = 0;
    return (usePound ? "#" : "") + (g | (b << 8) | (r << 16)).toString(16);
}

export function isLightColor(hex: string): boolean {
    if (!hex) return false;
    const color = hex.replace('#', '');
    const r = parseInt(color.substr(0, 2), 16);
    const g = parseInt(color.substr(2, 2), 16);
    const b = parseInt(color.substr(4, 2), 16);
    const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
    return yiq >= 128;
}

export function getTextColor(bgColor: string): string {
    if (!bgColor) return '#ffffff';
    // Logic for specific bright colors that need dark text
    if (bgColor.toLowerCase() === '#ffcc00' || isLightColor(bgColor)) {
        return '#003087'; // Dark blue for contrast on light backgrounds
    }
    return '#ffffff';
}
