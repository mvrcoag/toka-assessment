import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import * as amqp from 'amqplib';
import { EventBus } from '../../application/ports/event-bus';
import { DomainEvent } from '../../domain/events/domain-event';
import { UserConfig } from '../config/user.config';

@Injectable()
export class RabbitMqEventBus implements EventBus, OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RabbitMqEventBus.name);
  private connection?: amqp.ChannelModel;
  private channel?: amqp.Channel;
  private isShuttingDown = false;

  constructor(private readonly config: UserConfig) {}

  async onModuleInit(): Promise<void> {
    void this.connectWithRetry();
  }

  async onModuleDestroy(): Promise<void> {
    this.isShuttingDown = true;
    if (this.channel) {
      await this.channel.close();
    }
    if (this.connection) {
      await this.connection.close();
    }
  }

  async publish(event: DomainEvent): Promise<void> {
    if (!this.channel) {
      this.logger.warn('RabbitMQ channel not ready; event dropped');
      return;
    }

    const routingKey = this.toRoutingKey(event.name);
    const payload = {
      name: event.name,
      occurredAt: event.occurredAt.toISOString(),
      payload: event,
    };

    this.channel.publish(
      this.config.rabbitmqExchange,
      routingKey,
      Buffer.from(JSON.stringify(payload)),
      { contentType: 'application/json' },
    );
  }

  async publishAll(events: DomainEvent[]): Promise<void> {
    for (const event of events) {
      await this.publish(event);
    }
  }

  private async connectWithRetry(): Promise<void> {
    let attempt = 0;

    while (!this.isShuttingDown) {
      try {
        const connection = await amqp.connect(this.config.rabbitmqUrl);
        const channel = await connection.createChannel();
        await channel.assertExchange(this.config.rabbitmqExchange, 'topic', {
          durable: true,
        });
        this.connection = connection;
        this.channel = channel;
        this.logger.log('RabbitMQ connected');
        return;
      } catch (error) {
        attempt += 1;
        const delay = Math.min(30000, 1000 * Math.pow(2, attempt));
        this.logger.warn(
          `RabbitMQ connection failed (attempt ${attempt}); retrying in ${delay}ms`,
        );
        await this.sleep(delay);
      }
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private toRoutingKey(name: string): string {
    return name
      .replace(/([a-z])([A-Z])/g, '$1.$2')
      .replace(/\s+/g, '.')
      .toLowerCase();
  }
}
