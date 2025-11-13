import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { RegisterTokenDto } from './dto/register-token.dto';
import { SendNotificationDto } from './dto/send-notification.dto';
import { PushToken, PushTokenDocument } from './schemas/push-token.schema';
import {
  Notification,
  NotificationDocument,
} from './schemas/notification.schema';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectModel(PushToken.name)
    private readonly pushTokenModel: Model<PushTokenDocument>,
    @InjectModel(Notification.name)
    private readonly notificationModel: Model<NotificationDocument>,
  ) {}

  async registerToken(deviceId: string, registerTokenDto: RegisterTokenDto) {
    await this.pushTokenModel.findOneAndUpdate(
      { deviceId, token: registerTokenDto.token },
      {
        $set: {
          platform: registerTokenDto.platform || 'unknown',
          lastRegisteredAt: new Date(),
        },
      },
      { upsert: true, new: true },
    );

    return { success: true };
  }

  async sendNotification(sendNotificationDto: SendNotificationDto) {
    const notification = new this.notificationModel({
      title: sendNotificationDto.title,
      body: sendNotificationDto.body,
      targetDeviceIds: sendNotificationDto.deviceIds || [],
      status: 'pending',
    });

    await notification.save();
    return { success: true, notificationId: notification._id };
  }

  async pullNotifications(deviceId: string) {
    const notifications = await this.notificationModel
      .find({
        $or: [{ targetDeviceIds: { $size: 0 } }, { targetDeviceIds: deviceId }],
        status: 'pending',
      })
      .sort({ createdAt: -1 })
      .limit(10);

    const deliveredIds = notifications.map((notification) => notification._id);

    await this.notificationModel.updateMany(
      { _id: { $in: deliveredIds } },
      {
        $addToSet: { deliveredTo: deviceId },
        $set: { status: 'sent' },
      },
    );

    return {
      notifications: notifications.map((notification) => ({
        id: notification._id.toString(),
        title: notification.title,
        body: notification.body,
      })),
    };
  }
}
