import type { D1Database } from '@cloudflare/workers-types';
import type { RecurrenceRule, RecurrenceType, RecurrenceEndType } from '../../src/types';
import { nanoid } from 'nanoid';

export class RecurrenceService {
  constructor(private db: D1Database) {}

  /**
   * Create a recurrence rule for a task
   */
  async createRule(
    taskId: string,
    rule: Omit<RecurrenceRule, 'id' | 'created_at'>
  ): Promise<RecurrenceRule> {
    const ruleId = nanoid();
    const now = new Date().toISOString();

    // Validate rule
    this.validateRule(rule);

    await this.db
      .prepare(
        `
        INSERT INTO recurrence_rules (
          id, task_id, type, interval, days_of_week, day_of_month,
          week_of_month, day_of_week_for_month, custom_unit,
          end_type, end_date, end_count, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `
      )
      .bind(
        ruleId,
        taskId,
        rule.type,
        rule.interval,
        rule.days_of_week ? JSON.stringify(rule.days_of_week) : null,
        rule.day_of_month || null,
        rule.week_of_month || null,
        rule.day_of_week_for_month || null,
        rule.custom_unit || null,
        rule.end_type,
        rule.end_date || null,
        rule.end_count || null,
        now
      )
      .run();

    // Update task to mark as recurring
    await this.db
      .prepare('UPDATE tasks SET is_recurring = 1, recurrence_rule_id = ? WHERE id = ?')
      .bind(ruleId, taskId)
      .run();

    return this.getRule(ruleId);
  }

  /**
   * Get a recurrence rule by ID
   */
  async getRule(ruleId: string): Promise<RecurrenceRule> {
    const result = await this.db
      .prepare('SELECT * FROM recurrence_rules WHERE id = ?')
      .bind(ruleId)
      .first();

    if (!result) {
      throw new Error('Recurrence rule not found');
    }

    return this.mapRowToRule(result as any);
  }

  /**
   * Get recurrence rule for a task
   */
  async getRuleByTaskId(taskId: string): Promise<RecurrenceRule | null> {
    const result = await this.db
      .prepare('SELECT * FROM recurrence_rules WHERE task_id = ?')
      .bind(taskId)
      .first();

    if (!result) {
      return null;
    }

    return this.mapRowToRule(result as any);
  }

  /**
   * Update a recurrence rule
   */
  async updateRule(
    ruleId: string,
    updates: Partial<Omit<RecurrenceRule, 'id' | 'created_at' | 'task_id'>>
  ): Promise<RecurrenceRule> {
    // Get current rule
    const currentRule = await this.getRule(ruleId);

    // Merge updates
    const updatedRule: Omit<RecurrenceRule, 'id' | 'created_at'> = {
      type: updates.type ?? currentRule.type,
      interval: updates.interval ?? currentRule.interval,
      days_of_week: updates.days_of_week ?? currentRule.days_of_week,
      day_of_month: updates.day_of_month ?? currentRule.day_of_month,
      week_of_month: updates.week_of_month ?? currentRule.week_of_month,
      day_of_week_for_month: updates.day_of_week_for_month ?? currentRule.day_of_week_for_month,
      custom_unit: updates.custom_unit ?? currentRule.custom_unit,
      end_type: updates.end_type ?? currentRule.end_type,
      end_date: updates.end_date ?? currentRule.end_date,
      end_count: updates.end_count ?? currentRule.end_count,
    };

    // Validate updated rule
    this.validateRule(updatedRule);

    await this.db
      .prepare(
        `
        UPDATE recurrence_rules SET
          type = ?,
          interval = ?,
          days_of_week = ?,
          day_of_month = ?,
          week_of_month = ?,
          day_of_week_for_month = ?,
          custom_unit = ?,
          end_type = ?,
          end_date = ?,
          end_count = ?
        WHERE id = ?
      `
      )
      .bind(
        updatedRule.type,
        updatedRule.interval,
        updatedRule.days_of_week ? JSON.stringify(updatedRule.days_of_week) : null,
        updatedRule.day_of_month || null,
        updatedRule.week_of_month || null,
        updatedRule.day_of_week_for_month || null,
        updatedRule.custom_unit || null,
        updatedRule.end_type,
        updatedRule.end_date || null,
        updatedRule.end_count || null,
        ruleId
      )
      .run();

    return this.getRule(ruleId);
  }

  /**
   * Delete a recurrence rule
   */
  async deleteRule(ruleId: string, taskId: string): Promise<void> {
    await this.db.prepare('DELETE FROM recurrence_rules WHERE id = ?').bind(ruleId).run();

    // Update task to remove recurring flag
    await this.db
      .prepare('UPDATE tasks SET is_recurring = 0, recurrence_rule_id = NULL WHERE id = ?')
      .bind(taskId)
      .run();
  }

  /**
   * Validate recurrence rule
   */
  private validateRule(rule: Omit<RecurrenceRule, 'id' | 'created_at'>): void {
    if (rule.interval < 1) {
      throw new Error('Interval must be at least 1');
    }

    if (rule.type === 'weekly' && (!rule.days_of_week || rule.days_of_week.length === 0)) {
      throw new Error('Weekly recurrence requires at least one day of week');
    }

    if (rule.type === 'monthly' && !rule.day_of_month && !rule.week_of_month) {
      throw new Error('Monthly recurrence requires either day_of_month or week_of_month');
    }

    if (rule.type === 'monthly' && rule.week_of_month) {
      if (!rule.day_of_week_for_month && rule.week_of_month !== undefined) {
        throw new Error('Monthly recurrence with week_of_month requires day_of_week_for_month');
      }
      if (rule.week_of_month < 1 || rule.week_of_month > 5) {
        throw new Error('week_of_month must be between 1 and 5');
      }
    }

    if (rule.type === 'custom' && !rule.custom_unit) {
      throw new Error('Custom recurrence requires custom_unit');
    }

    if (rule.end_type === 'date' && !rule.end_date) {
      throw new Error('End type "date" requires end_date');
    }

    if (rule.end_type === 'count' && (!rule.end_count || rule.end_count < 1)) {
      throw new Error('End type "count" requires end_count >= 1');
    }
  }

  /**
   * Map database row to RecurrenceRule
   */
  private mapRowToRule(row: any): RecurrenceRule {
    return {
      id: row.id,
      type: row.type as RecurrenceType,
      interval: row.interval,
      days_of_week: row.days_of_week ? JSON.parse(row.days_of_week) : undefined,
      day_of_month: row.day_of_month || undefined,
      week_of_month: row.week_of_month || undefined,
      day_of_week_for_month: row.day_of_week_for_month || undefined,
      custom_unit: row.custom_unit || undefined,
      end_type: row.end_type as RecurrenceEndType,
      end_date: row.end_date || undefined,
      end_count: row.end_count || undefined,
      created_at: row.created_at,
    };
  }

  /**
   * Calculate next occurrence date based on rule
   */
  calculateNextOccurrence(
    rule: RecurrenceRule,
    lastOccurrence: Date,
    _startDate: Date
  ): Date | null {
    const next = new Date(lastOccurrence);

    switch (rule.type) {
      case 'daily':
        next.setDate(next.getDate() + rule.interval);
        break;

      case 'weekly':
        // Find next occurrence on specified days
        let daysToAdd = rule.interval * 7;
        const targetDays = rule.days_of_week || [];
        
        if (targetDays.length > 0) {
          let currentDay = next.getDay();
          // Convert Sunday (0) to 7 for easier calculation
          currentDay = currentDay === 0 ? 7 : currentDay;
          
          // Find next matching day
          const sortedDays = [...targetDays].sort((a, b) => a - b);
          let nextDay = sortedDays.find((d) => d > currentDay);
          
          if (!nextDay) {
            // Next week
            nextDay = sortedDays[0];
            daysToAdd = (7 - currentDay + nextDay) + (rule.interval - 1) * 7;
          } else {
            daysToAdd = nextDay - currentDay;
          }
          
          next.setDate(next.getDate() + daysToAdd);
        } else {
          next.setDate(next.getDate() + daysToAdd);
        }
        break;

      case 'monthly':
        if (rule.week_of_month && rule.day_of_week_for_month !== undefined) {
          // Calculate "N-th day of week in month" (e.g., "second Monday")
          next.setMonth(next.getMonth() + rule.interval);
          next.setDate(1); // Start from first day of month
          
          // Find first occurrence of the target day of week
          const targetDayOfWeek = rule.day_of_week_for_month; // 0 = Monday, 6 = Sunday
          const firstDayOfWeek = next.getDay();
          const daysToAdd = (targetDayOfWeek - firstDayOfWeek + 7) % 7;
          next.setDate(1 + daysToAdd);
          
          // Add weeks for week_of_month (1 = first, 2 = second, etc.)
          next.setDate(next.getDate() + (rule.week_of_month - 1) * 7);
          
          // If we went past the month, go to last occurrence
          const month = next.getMonth();
          next.setDate(next.getDate() + 7);
          if (next.getMonth() !== month) {
            next.setDate(next.getDate() - 14); // Go back to last occurrence
          }
        } else if (rule.day_of_month) {
          next.setMonth(next.getMonth() + rule.interval);
          next.setDate(rule.day_of_month);
        } else {
          next.setMonth(next.getMonth() + rule.interval);
        }
        break;

      case 'yearly':
        next.setFullYear(next.getFullYear() + rule.interval);
        break;

      case 'workdays':
        // Monday to Friday
        let added = 0;
        while (added < rule.interval) {
          next.setDate(next.getDate() + 1);
          const day = next.getDay();
          if (day !== 0 && day !== 6) {
            // Not Sunday or Saturday
            added++;
          }
        }
        break;

      case 'weekends':
        // Saturday and Sunday
        let addedWeekends = 0;
        while (addedWeekends < rule.interval) {
          next.setDate(next.getDate() + 1);
          const day = next.getDay();
          if (day === 0 || day === 6) {
            // Saturday or Sunday
            addedWeekends++;
          }
        }
        break;

      case 'custom':
        // Custom interval with specified unit
        const unit = rule.custom_unit || 'days';
        switch (unit) {
          case 'hours':
            next.setHours(next.getHours() + rule.interval);
            break;
          case 'days':
            next.setDate(next.getDate() + rule.interval);
            break;
          case 'weeks':
            next.setDate(next.getDate() + rule.interval * 7);
            break;
          case 'months':
            next.setMonth(next.getMonth() + rule.interval);
            break;
          default:
            // Fallback to days
            next.setDate(next.getDate() + rule.interval);
        }
        break;

      default:
        return null;
    }

    // Check end conditions
    if (rule.end_type === 'date' && rule.end_date) {
      const endDate = new Date(rule.end_date);
      if (next > endDate) {
        return null;
      }
    }

    return next;
  }

  /**
   * Check if rule should continue generating instances
   */
  shouldContinue(rule: RecurrenceRule, occurrenceCount: number, currentDate: Date): boolean {
    if (rule.end_type === 'never') {
      return true;
    }

    if (rule.end_type === 'date' && rule.end_date) {
      const endDate = new Date(rule.end_date);
      return currentDate <= endDate;
    }

    if (rule.end_type === 'count' && rule.end_count) {
      return occurrenceCount < rule.end_count;
    }

    return true;
  }
}

