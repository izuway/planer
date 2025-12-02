import { Hono } from 'hono';
import type { Env, Variables } from '../types';
import { TaskService } from '../services/taskService';
import { TaskHistoryService } from '../services/taskHistoryService';
import { RecurrenceService } from '../services/recurrenceService';
import { TaskInstanceService } from '../services/taskInstanceService';
import type { CreateTaskDTO, UpdateTaskDTO, TaskFilters, RecurrenceRule } from '../../src/types';

const tasks = new Hono<{ Bindings: Env; Variables: Variables }>();

/**
 * GET /api/tasks
 * Get all tasks for the authenticated user with optional filters
 */
tasks.get('/', async (c) => {
  const user = c.get('user');
  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const taskService = new TaskService(c.env.DB);

  // Parse query parameters
  const includeArchivedParam = c.req.query('include_archived');
  const includeSharedParam = c.req.query('include_shared');
  const onlySharedParam = c.req.query('only_shared');
  
  const filters: TaskFilters = {
    date: c.req.query('date') || undefined,
    start_date: c.req.query('start_date') || undefined,
    end_date: c.req.query('end_date') || undefined,
    status: c.req.query('status') as any || undefined,
    priority: c.req.query('priority') as any || undefined,
    tags: c.req.query('tags') ? c.req.query('tags')!.split(',').filter(t => t.trim()) : undefined,
    search: c.req.query('search') || undefined,
    include_archived: includeArchivedParam === 'true' || includeArchivedParam === '1',
    include_shared: includeSharedParam === 'true' || includeSharedParam === '1',
    only_shared: onlySharedParam === 'true' || onlySharedParam === '1',
    sort_by: c.req.query('sort_by') as any || undefined,
    sort_order: c.req.query('sort_order') as any || undefined,
    page: c.req.query('page') ? parseInt(c.req.query('page')!) : undefined,
    limit: c.req.query('limit') ? parseInt(c.req.query('limit')!) : undefined,
  };

  try {
    // Safe logging - avoid JSON.stringify on filters to prevent recursion
    console.log('Fetching tasks for user:', user.uid);
    
    const tasksList = await taskService.getTasks(user.uid, filters);
    
    console.log('Retrieved tasks count:', tasksList.length);
    
    // Ensure we return plain objects to avoid serialization issues
    // Use a safe serialization approach to prevent recursion
    const plainTasks = tasksList.map((task, index) => {
      try {
        // Safely extract task properties to avoid proxy/getter issues
        const safeGet = (obj: any, key: string, defaultValue: any = null) => {
          try {
            if (obj && typeof obj === 'object' && key in obj) {
              const val = obj[key];
              return val === null || val === undefined ? defaultValue : val;
            }
            return defaultValue;
          } catch {
            return defaultValue;
          }
        };
        
        const plainTask: any = {
          id: String(safeGet(task, 'id', '')),
          user_id: String(safeGet(task, 'user_id', '')),
          title: String(safeGet(task, 'title', '')),
          description: safeGet(task, 'description') ? String(safeGet(task, 'description')) : undefined,
          start_datetime: String(safeGet(task, 'start_datetime', '')),
          deadline_datetime: safeGet(task, 'deadline_datetime') ? String(safeGet(task, 'deadline_datetime')) : undefined,
          priority: String(safeGet(task, 'priority', 'medium')),
          status: String(safeGet(task, 'status', 'planned')),
          is_recurring: Boolean(safeGet(task, 'is_recurring', false)),
          recurrence_rule_id: safeGet(task, 'recurrence_rule_id') ? String(safeGet(task, 'recurrence_rule_id')) : undefined,
          is_archived: Boolean(safeGet(task, 'is_archived', false)),
          created_at: safeGet(task, 'created_at') ? String(safeGet(task, 'created_at')) : undefined,
          updated_at: safeGet(task, 'updated_at') ? String(safeGet(task, 'updated_at')) : undefined,
          tags: [],
        };
        
        // Safely extract tags
        const tags = safeGet(task, 'tags');
        if (tags && Array.isArray(tags) && tags.length > 0) {
          try {
            plainTask.tags = tags.slice(0, 100).map((tag: any) => {
              try {
                return {
                  id: String(safeGet(tag, 'id', '')),
                  user_id: String(safeGet(tag, 'user_id', '')),
                  name: String(safeGet(tag, 'name', '')),
                  color: String(safeGet(tag, 'color', '#000000')),
                  created_at: safeGet(tag, 'created_at') ? String(safeGet(tag, 'created_at')) : undefined,
                };
              } catch {
                return null;
              }
            }).filter((tag: any) => tag !== null);
          } catch {
            plainTask.tags = [];
          }
        }
        
        // Safely extract shared task metadata
        if (safeGet(task, 'is_shared') !== undefined) {
          plainTask.is_shared = Boolean(safeGet(task, 'is_shared'));
        }
        const sharedBy = safeGet(task, 'shared_by');
        if (sharedBy) {
          plainTask.shared_by = String(sharedBy);
        }
        const sharedByName = safeGet(task, 'shared_by_name');
        if (sharedByName) {
          plainTask.shared_by_name = String(sharedByName);
        }
        const permission = safeGet(task, 'permission');
        if (permission) {
          plainTask.permission = String(permission);
        }
        
        return plainTask;
      } catch (taskError: any) {
        // Safe error logging
        let errorMsg = 'Unknown task mapping error';
        try {
          errorMsg = taskError?.message || String(taskError) || 'Unknown task mapping error';
          if (errorMsg.length > 100) {
            errorMsg = errorMsg.substring(0, 100);
          }
        } catch {
          errorMsg = 'Error extracting error message';
        }
        console.error(`Error mapping task at index ${index}:`, errorMsg);
        // Return null and filter it out
        return null;
      }
    }).filter((task): task is NonNullable<typeof task> => task !== null);
    
    console.log('Successfully mapped tasks count:', plainTasks.length);
    
    return c.json({
      success: true,
      data: plainTasks,
    });
  } catch (error: any) {
    // Safe error logging to avoid recursion
    let errorMessage = 'Unknown error';
    let errorStack: string | undefined;
    
    try {
      if (error instanceof Error) {
        errorMessage = error.message || 'Unknown error';
        errorStack = error.stack ? String(error.stack).substring(0, 500) : undefined;
      } else if (typeof error === 'string') {
        errorMessage = error;
      } else if (error && typeof error === 'object') {
        // Try to extract message safely
        try {
          errorMessage = error.message || error.error || String(error);
        } catch {
          errorMessage = 'Error object could not be serialized';
        }
      } else {
        errorMessage = String(error);
      }
    } catch {
      errorMessage = 'Error occurred but could not be serialized';
    }
    
    console.error('Error fetching tasks:', errorMessage);
    if (errorStack) {
      console.error('Error stack (truncated):', errorStack);
    }
    
    // Safely log filters without JSON.stringify to avoid recursion
    try {
      const filterKeys = Object.keys(filters || {});
      console.error('Filters keys:', filterKeys.join(', '));
    } catch {
      console.error('Could not log filters');
    }
    
    // Return simple error response without complex objects
    return c.json(
      {
        success: false,
        error: 'Internal Server Error',
        message: errorMessage,
      },
      500
    );
  }
});

/**
 * GET /api/tasks/:id
 * Get a single task by ID
 */
tasks.get('/:id', async (c) => {
  const user = c.get('user');
  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const taskId = c.req.param('id');
  const taskService = new TaskService(c.env.DB);

  try {
    const task = await taskService.getTaskById(taskId, user.uid);
    
    if (!task) {
      return c.json(
        {
          success: false,
          error: 'Task not found',
        },
        404
      );
    }

    return c.json({
      success: true,
      data: task,
    });
  } catch (error: any) {
    console.error('Error fetching task:', error);
    return c.json(
      {
        success: false,
        error: 'Failed to fetch task',
        message: error.message,
      },
      500
    );
  }
});

/**
 * POST /api/tasks
 * Create a new task
 */
tasks.post('/', async (c) => {
  const user = c.get('user');
  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    const data: CreateTaskDTO = await c.req.json();
    
    // Validate required fields
    if (!data.title || !data.start_datetime) {
      return c.json(
        {
          success: false,
          error: 'Validation error',
          message: 'Title and start_datetime are required',
        },
        400
      );
    }

    const taskService = new TaskService(c.env.DB);
    const task = await taskService.createTask(user.uid, data);

    return c.json(
      {
        success: true,
        data: task,
        message: 'Task created successfully',
      },
      201
    );
  } catch (error: any) {
    console.error('Error creating task:', error);
    return c.json(
      {
        success: false,
        error: 'Failed to create task',
        message: error.message,
      },
      500
    );
  }
});

/**
 * PATCH /api/tasks/:id
 * Update a task
 */
tasks.patch('/:id', async (c) => {
  const user = c.get('user');
  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const taskId = c.req.param('id');

  try {
    const data: UpdateTaskDTO = await c.req.json();
    const taskService = new TaskService(c.env.DB);
    
    const task = await taskService.updateTask(taskId, user.uid, data);
    
    if (!task) {
      return c.json(
        {
          success: false,
          error: 'Task not found or no permission',
        },
        404
      );
    }

    return c.json({
      success: true,
      data: task,
      message: 'Task updated successfully',
    });
  } catch (error: any) {
    console.error('Error updating task:', error);
    
    if (error.message === 'No permission to edit this task') {
      return c.json(
        {
          success: false,
          error: 'Forbidden',
          message: error.message,
        },
        403
      );
    }
    
    return c.json(
      {
        success: false,
        error: 'Failed to update task',
        message: error.message,
      },
      500
    );
  }
});

/**
 * DELETE /api/tasks/:id
 * Delete a task (hard delete)
 */
tasks.delete('/:id', async (c) => {
  const user = c.get('user');
  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const taskId = c.req.param('id');
  const taskService = new TaskService(c.env.DB);

  try {
    const success = await taskService.deleteTask(taskId, user.uid);
    
    if (!success) {
      return c.json(
        {
          success: false,
          error: 'Task not found or no permission',
        },
        404
      );
    }

    return c.json({
      success: true,
      message: 'Task deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting task:', error);
    return c.json(
      {
        success: false,
        error: 'Failed to delete task',
        message: error.message,
      },
      500
    );
  }
});

/**
 * POST /api/tasks/:id/archive
 * Archive a task (soft delete)
 */
tasks.post('/:id/archive', async (c) => {
  const user = c.get('user');
  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const taskId = c.req.param('id');
  const taskService = new TaskService(c.env.DB);

  try {
    const success = await taskService.archiveTask(taskId, user.uid);
    
    if (!success) {
      return c.json(
        {
          success: false,
          error: 'Task not found or no permission',
        },
        404
      );
    }

    return c.json({
      success: true,
      message: 'Task archived successfully',
    });
  } catch (error: any) {
    console.error('Error archiving task:', error);
    return c.json(
      {
        success: false,
        error: 'Failed to archive task',
        message: error.message,
      },
      500
    );
  }
});

/**
 * POST /api/tasks/:id/duplicate
 * Duplicate a task
 */
tasks.post('/:id/duplicate', async (c) => {
  const user = c.get('user');
  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const taskId = c.req.param('id');
  const taskService = new TaskService(c.env.DB);

  try {
    const newTask = await taskService.duplicateTask(taskId, user.uid);
    
    if (!newTask) {
      return c.json(
        {
          success: false,
          error: 'Task not found',
        },
        404
      );
    }

    return c.json(
      {
        success: true,
        data: newTask,
        message: 'Task duplicated successfully',
      },
      201
    );
  } catch (error: any) {
    console.error('Error duplicating task:', error);
    return c.json(
      {
        success: false,
        error: 'Failed to duplicate task',
        message: error.message,
      },
      500
    );
  }
});

/**
 * GET /api/tasks/:id/history
 * Get task history
 */
tasks.get('/:id/history', async (c) => {
  const user = c.get('user');
  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const taskId = c.req.param('id');
  const historyService = new TaskHistoryService(c.env.DB);

  try {
    const history = await historyService.getTaskHistory(taskId, user.uid);
    
    return c.json({
      success: true,
      data: history,
    });
  } catch (error: any) {
    console.error('Error fetching task history:', error);
    
    if (error.message === 'Task not found or no permission') {
      return c.json(
        {
          success: false,
          error: 'Task not found or no permission',
        },
        404
      );
    }
    
    return c.json(
      {
        success: false,
        error: 'Failed to fetch task history',
        message: error.message,
      },
      500
    );
  }
});

/**
 * POST /api/tasks/:id/recurrence
 * Create recurrence rule for a task
 */
tasks.post('/:id/recurrence', async (c) => {
  const user = c.get('user');
  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const taskId = c.req.param('id');
  const taskService = new TaskService(c.env.DB);
  const recurrenceService = new RecurrenceService(c.env.DB);

  try {
    // Check if user owns the task
    const task = await taskService.getTaskById(taskId, user.uid);
    if (!task || task.user_id !== user.uid) {
      return c.json(
        {
          success: false,
          error: 'Task not found or no permission',
        },
        404
      );
    }

    const ruleData: Omit<RecurrenceRule, 'id' | 'created_at'> = await c.req.json();
    const rule = await recurrenceService.createRule(taskId, ruleData);

    return c.json(
      {
        success: true,
        data: rule,
        message: 'Recurrence rule created successfully',
      },
      201
    );
  } catch (error: any) {
    console.error('Error creating recurrence rule:', error);
    return c.json(
      {
        success: false,
        error: 'Failed to create recurrence rule',
        message: error.message,
      },
      500
    );
  }
});

/**
 * GET /api/tasks/:id/recurrence
 * Get recurrence rule for a task
 */
tasks.get('/:id/recurrence', async (c) => {
  const user = c.get('user');
  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const taskId = c.req.param('id');
  const taskService = new TaskService(c.env.DB);
  const recurrenceService = new RecurrenceService(c.env.DB);

  try {
    // Check if user has access to the task
    const task = await taskService.getTaskById(taskId, user.uid);
    if (!task) {
      return c.json(
        {
          success: false,
          error: 'Task not found or no permission',
        },
        404
      );
    }

    const rule = await recurrenceService.getRuleByTaskId(taskId);
    
    if (!rule) {
      return c.json(
        {
          success: false,
          error: 'Recurrence rule not found',
        },
        404
      );
    }

    return c.json({
      success: true,
      data: rule,
    });
  } catch (error: any) {
    console.error('Error fetching recurrence rule:', error);
    return c.json(
      {
        success: false,
        error: 'Failed to fetch recurrence rule',
        message: error.message,
      },
      500
    );
  }
});

/**
 * PUT /api/tasks/:id/recurrence
 * Update recurrence rule for a task
 */
tasks.put('/:id/recurrence', async (c) => {
  const user = c.get('user');
  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const taskId = c.req.param('id');
  const taskService = new TaskService(c.env.DB);
  const recurrenceService = new RecurrenceService(c.env.DB);

  try {
    // Check if user owns the task
    const task = await taskService.getTaskById(taskId, user.uid);
    if (!task || task.user_id !== user.uid) {
      return c.json(
        {
          success: false,
          error: 'Task not found or no permission',
        },
        404
      );
    }

    const rule = await recurrenceService.getRuleByTaskId(taskId);
    if (!rule) {
      return c.json(
        {
          success: false,
          error: 'Recurrence rule not found',
        },
        404
      );
    }

    const updates: Partial<Omit<RecurrenceRule, 'id' | 'created_at' | 'task_id'>> = await c.req.json();
    const updatedRule = await recurrenceService.updateRule(rule.id, updates);

    return c.json({
      success: true,
      data: updatedRule,
      message: 'Recurrence rule updated successfully',
    });
  } catch (error: any) {
    console.error('Error updating recurrence rule:', error);
    return c.json(
      {
        success: false,
        error: 'Failed to update recurrence rule',
        message: error.message,
      },
      500
    );
  }
});

/**
 * DELETE /api/tasks/:id/recurrence
 * Delete recurrence rule for a task
 */
tasks.delete('/:id/recurrence', async (c) => {
  const user = c.get('user');
  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const taskId = c.req.param('id');
  const taskService = new TaskService(c.env.DB);
  const recurrenceService = new RecurrenceService(c.env.DB);

  try {
    // Check if user owns the task
    const task = await taskService.getTaskById(taskId, user.uid);
    if (!task || task.user_id !== user.uid) {
      return c.json(
        {
          success: false,
          error: 'Task not found or no permission',
        },
        404
      );
    }

    const rule = await recurrenceService.getRuleByTaskId(taskId);
    if (!rule) {
      return c.json(
        {
          success: false,
          error: 'Recurrence rule not found',
        },
        404
      );
    }

    await recurrenceService.deleteRule(rule.id, taskId);

    return c.json({
      success: true,
      message: 'Recurrence rule deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting recurrence rule:', error);
    return c.json(
      {
        success: false,
        error: 'Failed to delete recurrence rule',
        message: error.message,
      },
      500
    );
  }
});

/**
 * POST /api/tasks/:id/instances/generate
 * Generate instances for a recurring task
 */
tasks.post('/:id/instances/generate', async (c) => {
  const user = c.get('user');
  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const taskId = c.req.param('id');
  const instanceService = new TaskInstanceService(c.env.DB);

  try {
    const maxInstances = c.req.query('max') ? parseInt(c.req.query('max')!) : 30;
    const daysAhead = c.req.query('days') ? parseInt(c.req.query('days')!) : 90;

    const instances = await instanceService.generateInstances(taskId, user.uid, maxInstances, daysAhead);

    return c.json({
      success: true,
      data: instances,
      message: `Generated ${instances.length} instances`,
    });
  } catch (error: any) {
    console.error('Error generating instances:', error);
    return c.json(
      {
        success: false,
        error: 'Failed to generate instances',
        message: error.message,
      },
      500
    );
  }
});

/**
 * GET /api/tasks/:id/instances
 * Get all instances for a task
 */
tasks.get('/:id/instances', async (c) => {
  const user = c.get('user');
  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const taskId = c.req.param('id');
  const instanceService = new TaskInstanceService(c.env.DB);
  const taskService = new TaskService(c.env.DB);

  try {
    // Check if user has access to the task
    const task = await taskService.getTaskById(taskId, user.uid);
    if (!task) {
      return c.json(
        {
          success: false,
          error: 'Task not found or no permission',
        },
        404
      );
    }

    const instances = await instanceService.getInstances(taskId);

    return c.json({
      success: true,
      data: instances,
    });
  } catch (error: any) {
    console.error('Error fetching instances:', error);
    return c.json(
      {
        success: false,
        error: 'Failed to fetch instances',
        message: error.message,
      },
      500
    );
  }
});

/**
 * PATCH /api/tasks/instances/:instanceId
 * Update a task instance
 */
tasks.patch('/instances/:instanceId', async (c) => {
  const user = c.get('user');
  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const instanceId = c.req.param('instanceId');
  const instanceService = new TaskInstanceService(c.env.DB);

  try {
    const updates = await c.req.json();
    const instance = await instanceService.updateInstance(instanceId, user.uid, updates);
    
    if (!instance) {
      return c.json(
        {
          success: false,
          error: 'Instance not found or no permission',
        },
        404
      );
    }

    return c.json({
      success: true,
      data: instance,
      message: 'Instance updated successfully',
    });
  } catch (error: any) {
    console.error('Error updating instance:', error);
    return c.json(
      {
        success: false,
        error: 'Failed to update instance',
        message: error.message,
      },
      500
    );
  }
});

/**
 * DELETE /api/tasks/instances/:instanceId
 * Delete a task instance
 */
tasks.delete('/instances/:instanceId', async (c) => {
  const user = c.get('user');
  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const instanceId = c.req.param('instanceId');
  const instanceService = new TaskInstanceService(c.env.DB);

  try {
    const success = await instanceService.deleteInstance(instanceId, user.uid);
    
    if (!success) {
      return c.json(
        {
          success: false,
          error: 'Instance not found or no permission',
        },
        404
      );
    }

    return c.json({
      success: true,
      message: 'Instance deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting instance:', error);
    return c.json(
      {
        success: false,
        error: 'Failed to delete instance',
        message: error.message,
      },
      500
    );
  }
});

export default tasks;



