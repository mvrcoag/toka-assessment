import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import * as amqp from 'amqplib';
import { CreateAuditLogUseCase } from '../../application/use-cases/create-audit-log.use-case';
import { AuditConfig } from '../config/audit.config';

interface EventEnvelope {
  name: string;
  occurredAt: string;
  payload: Record<string, unknown>;
}

@Injectable()
export class AuditEventConsumer implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(AuditEventConsumer.name);
  private connection?: amqp.ChannelModel;
  private channel?: amqp.Channel;
  private isShuttingDown = false;

  constructor(
    private readonly config: AuditConfig,
    private readonly createAuditLog: CreateAuditLogUseCase,
  ) {}

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

  private async handleMessage(message: amqp.ConsumeMessage | null): Promise<void> {
    if (!message || !this.channel) {
      return;
    }

    try {
      const raw = message.content.toString('utf-8');
      const event = JSON.parse(raw) as EventEnvelope;
      const occurredAt = this.parseDate(event.occurredAt);
      const payload = event.payload ?? {};

      await this.createAuditLog.execute({
        action: event.name,
        resource: this.inferResource(event.name),
        actorId: this.readActorId(payload),
        actorRole: this.readActorRole(payload),
        metadata: payload,
        occurredAt,
      });
    } catch {
      this.logger.warn('Failed to process audit event');
    } finally {
      this.channel.ack(message);
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
        const queue = await channel.assertQueue(this.config.rabbitmqQueue, {
          durable: true,
        });
        await channel.bindQueue(queue.queue, this.config.rabbitmqExchange, '#');
        await channel.consume(queue.queue, (msg) => this.handleMessage(msg), {
          noAck: false,
        });
        this.connection = connection;
        this.channel = channel;
        this.logger.log('RabbitMQ consumer connected');
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

  private parseDate(value: string | undefined): Date | undefined {
    if (!value) {
      return undefined;
    }

    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? undefined : date;
  }

  private readActorId(payload: Record<string, unknown>): string | undefined {
    const actorId = payload.actorId ?? payload.userId ?? payload.sub;
    return typeof actorId === 'string' ? actorId : undefined;
  }

  private readActorRole(payload: Record<string, unknown>): string | undefined {
    const role = payload.actorRole ?? payload.role;
    return typeof role === 'string' ? role : undefined;
  }

  private inferResource(name: string): string {
    const lowered = name.toLowerCase();
    if (lowered.includes('role')) {
      return 'role';
    }
    if (lowered.includes('user')) {
      return 'user';
    }
    if (lowered.includes('auth')) {
      return 'auth';
    }
    if (lowered.includes('ai')) {
      return 'ai';
    }

    return 'event';
  }
}
