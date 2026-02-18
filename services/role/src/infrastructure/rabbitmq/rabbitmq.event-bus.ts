import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import * as amqp from 'amqplib';
import { EventBus } from '../../application/ports/event-bus';
import { DomainEvent } from '../../domain/events/domain-event';
import { RoleConfig } from '../config/role.config';

@Injectable()
export class RabbitMqEventBus implements EventBus, OnModuleInit, OnModuleDestroy {
  private connection?: amqp.ChannelModel;
  private channel?: amqp.Channel;

  constructor(private readonly config: RoleConfig) {}

  async onModuleInit(): Promise<void> {
    const connection = await amqp.connect(this.config.rabbitmqUrl);
    const channel = await connection.createChannel();
    await channel.assertExchange(this.config.rabbitmqExchange, 'topic', {
      durable: true,
    });
    this.connection = connection;
    this.channel = channel;
  }

  async onModuleDestroy(): Promise<void> {
    if (this.channel) {
      await this.channel.close();
    }
    if (this.connection) {
      await this.connection.close();
    }
  }

  async publish(event: DomainEvent): Promise<void> {
    if (!this.channel) {
      throw new Error('RabbitMQ channel not initialized');
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

  private toRoutingKey(name: string): string {
    return name
      .replace(/([a-z])([A-Z])/g, '$1.$2')
      .replace(/\s+/g, '.')
      .toLowerCase();
  }
}
