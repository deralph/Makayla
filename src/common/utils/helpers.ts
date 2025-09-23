export class Helpers {
  static generateRandomString(length: number): string {
    const characters =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += characters.charAt(
        Math.floor(Math.random() * characters.length),
      );
    }
    return result;
  }

  static calculateOfflineEarnings(
    lastSync: Date,
    profitPerHour: number,
  ): number {
    const now = new Date();
    const hoursDiff = (now.getTime() - lastSync.getTime()) / (1000 * 60 * 60);
    return Math.floor(hoursDiff * profitPerHour);
  }

  static formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  }

  static isValidDeviceId(deviceId: string): boolean {
    const deviceIdRegex = /^[a-zA-Z0-9\-_]{10,}$/;
    return deviceIdRegex.test(deviceId);
  }
}
