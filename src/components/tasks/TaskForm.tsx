import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  MenuItem,
  Stack,
  Chip,
  Autocomplete,
  CircularProgress,
  Alert,
  FormControlLabel,
  Checkbox,
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { ru } from 'date-fns/locale';
import { useNavigate, useParams } from 'react-router-dom';
import { Save as SaveIcon, Cancel as CancelIcon } from '@mui/icons-material';
import { createTask, updateTask, getTaskById, getTags, getRecurrenceRule, updateRecurrenceRule, createRecurrenceRule, generateTaskInstances } from '../../utils/api';
import type { CreateTaskDTO, UpdateTaskDTO, Tag, TaskPriority, TaskStatus, RecurrenceRule } from '../../types';
import { RecurrenceRuleForm } from './RecurrenceRuleForm';

export const TaskForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditMode = Boolean(id);

  const [loading, setLoading] = useState(isEditMode);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [availableTags, setAvailableTags] = useState<Tag[]>([]);
  
  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startDateTime, setStartDateTime] = useState<Date | null>(new Date());
  const [deadlineDateTime, setDeadlineDateTime] = useState<Date | null>(null);
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [status, setStatus] = useState<TaskStatus>('planned');
  const [selectedTags, setSelectedTags] = useState<Tag[]>([]);
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceRule, setRecurrenceRule] = useState<Omit<RecurrenceRule, 'id' | 'created_at'> | null>(null);

  // Validation errors
  const [titleError, setTitleError] = useState('');
  const [dateError, setDateError] = useState('');

  useEffect(() => {
    loadTags();
    if (isEditMode && id) {
      loadTask(id);
    }
  }, [id, isEditMode]);

  const loadTags = async () => {
    try {
      const tags = await getTags();
      setAvailableTags(tags);
    } catch (err: any) {
      console.error('Error loading tags:', err);
    }
  };

  const loadTask = async (taskId: string) => {
    try {
      setLoading(true);
      const task = await getTaskById(taskId);
      
      setTitle(task.title);
      setDescription(task.description || '');
      setStartDateTime(new Date(task.start_datetime));
      setDeadlineDateTime(task.deadline_datetime ? new Date(task.deadline_datetime) : null);
      setPriority(task.priority);
      setStatus(task.status);
      setSelectedTags(task.tags || []);
      setIsRecurring(task.is_recurring);
      
      // Load recurrence rule if task is recurring
      if (task.is_recurring) {
        try {
          const rule = await getRecurrenceRule(taskId);
          if (rule) {
            setRecurrenceRule(rule);
          }
        } catch (err) {
          console.error('Error loading recurrence rule:', err);
          // Don't fail task loading if rule loading fails
        }
      }
    } catch (err: any) {
      console.error('Error loading task:', err);
      setError('Не удалось загрузить задачу');
    } finally {
      setLoading(false);
    }
  };

  const validateForm = (): boolean => {
    let isValid = true;
    
    if (!title.trim()) {
      setTitleError('Название обязательно');
      isValid = false;
    } else {
      setTitleError('');
    }

    if (!startDateTime) {
      setDateError('Дата и время начала обязательны');
      isValid = false;
    } else if (deadlineDateTime && deadlineDateTime < startDateTime) {
      setDateError('Дедлайн не может быть раньше даты начала');
      isValid = false;
    } else {
      setDateError('');
    }

    // Validate recurrence rule
    if (isRecurring && recurrenceRule) {
      if (recurrenceRule.type === 'weekly' && (!recurrenceRule.days_of_week || recurrenceRule.days_of_week.length === 0)) {
        setError('Для еженедельного повторения необходимо выбрать хотя бы один день недели');
        isValid = false;
      }
      if (recurrenceRule.type === 'monthly') {
        const hasDayOfMonth = recurrenceRule.day_of_month !== undefined;
        const hasWeekOfMonth = recurrenceRule.week_of_month !== undefined && recurrenceRule.day_of_week_for_month !== undefined;
        if (!hasDayOfMonth && !hasWeekOfMonth) {
          setError('Для ежемесячного повторения необходимо указать день месяца или день недели');
          isValid = false;
        }
      }
      if (recurrenceRule.type === 'custom' && !recurrenceRule.custom_unit) {
        setError('Для кастомного повторения необходимо указать единицу измерения');
        isValid = false;
      }
    }

    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      setSaving(true);
      setError(null);

      if (isEditMode && id) {
        const updates: UpdateTaskDTO = {
          title: title.trim(),
          description: description.trim() || undefined,
          start_datetime: startDateTime!.toISOString(),
          deadline_datetime: deadlineDateTime?.toISOString() || undefined,
          priority,
          status,
          tag_ids: selectedTags.map(t => t.id),
        };
        
        const updatedTask = await updateTask(id, updates);
        
        // Handle recurrence rule updates
        if (isRecurring && recurrenceRule) {
          try {
            const existingRule = await getRecurrenceRule(id);
            if (existingRule) {
              // Update existing rule
              await updateRecurrenceRule(id, recurrenceRule);
            } else {
              // Create new rule
              await createRecurrenceRule(id, recurrenceRule);
            }
            // Generate instances if needed
            try {
              await generateTaskInstances(id, 30, 90);
            } catch (err) {
              console.error('Error generating instances:', err);
              // Don't fail task update if instance generation fails
            }
          } catch (err: any) {
            console.error('Error updating recurrence rule:', err);
            setError('Задача обновлена, но не удалось обновить правило повторения');
          }
        } else if (!isRecurring) {
          // If recurring was disabled, try to delete the rule
          try {
            const existingRule = await getRecurrenceRule(id);
            if (existingRule) {
              // Rule deletion will be handled by backend when is_recurring is set to false
              // We just need to update the task
            }
          } catch (err) {
            // Ignore errors when checking for rule
          }
        }
      } else {
        const taskData: CreateTaskDTO = {
          title: title.trim(),
          description: description.trim() || undefined,
          start_datetime: startDateTime!.toISOString(),
          deadline_datetime: deadlineDateTime?.toISOString() || undefined,
          priority,
          status,
          tag_ids: selectedTags.map(t => t.id),
          is_recurring: isRecurring,
          recurrence_rule: isRecurring && recurrenceRule ? recurrenceRule : undefined,
        };
        
        const newTask = await createTask(taskData);
        
        // Generate instances automatically for new recurring tasks
        if (isRecurring && newTask.is_recurring) {
          try {
            await generateTaskInstances(newTask.id, 30, 90);
          } catch (err) {
            console.error('Error generating instances:', err);
            // Don't fail task creation if instance generation fails
          }
        }
      }

      navigate('/tasks');
    } catch (err: any) {
      console.error('Error saving task:', err);
      setError(err.message || 'Не удалось сохранить задачу');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    navigate(-1);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress size={60} />
      </Box>
    );
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ru}>
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Typography variant="h4" fontWeight={600} mb={3}>
          {isEditMode ? 'Редактировать задачу' : 'Создать задачу'}
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Card elevation={3}>
          <CardContent sx={{ p: 4 }}>
            <form onSubmit={handleSubmit}>
              <Stack spacing={3}>
                {/* Title */}
                <TextField
                  label="Название"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  error={Boolean(titleError)}
                  helperText={titleError}
                  required
                  fullWidth
                  autoFocus
                />

                {/* Description */}
                <TextField
                  label="Описание"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  multiline
                  rows={4}
                  fullWidth
                />

                {/* Start DateTime */}
                <DateTimePicker
                  label="Дата и время начала"
                  value={startDateTime}
                  onChange={(newValue) => setStartDateTime(newValue)}
                  slotProps={{
                    textField: {
                      required: true,
                      error: Boolean(dateError),
                      helperText: dateError,
                      fullWidth: true,
                    },
                  }}
                />

                {/* Deadline DateTime */}
                <DateTimePicker
                  label="Дедлайн (опционально)"
                  value={deadlineDateTime}
                  onChange={(newValue) => setDeadlineDateTime(newValue)}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                    },
                  }}
                />

                {/* Priority */}
                <TextField
                  select
                  label="Приоритет"
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as TaskPriority)}
                  fullWidth
                >
                  <MenuItem value="low">Низкий</MenuItem>
                  <MenuItem value="medium">Средний</MenuItem>
                  <MenuItem value="high">Высокий</MenuItem>
                  <MenuItem value="critical">Критический</MenuItem>
                </TextField>

                {/* Status */}
                {isEditMode && (
                  <TextField
                    select
                    label="Статус"
                    value={status}
                    onChange={(e) => setStatus(e.target.value as TaskStatus)}
                    fullWidth
                  >
                    <MenuItem value="planned">Запланирована</MenuItem>
                    <MenuItem value="in_progress">В работе</MenuItem>
                    <MenuItem value="done">Выполнена</MenuItem>
                    <MenuItem value="skipped">Пропущена</MenuItem>
                    <MenuItem value="canceled">Отменена</MenuItem>
                  </TextField>
                )}

                {/* Tags */}
                <Autocomplete
                  multiple
                  options={availableTags}
                  getOptionLabel={(option) => option.name}
                  value={selectedTags}
                  onChange={(_, newValue) => setSelectedTags(newValue)}
                  renderInput={(params) => (
                    <TextField {...params} label="Теги" placeholder="Выберите теги" />
                  )}
                  renderTags={(value, getTagProps) =>
                    value.map((option, index) => (
                      <Chip
                        label={option.name}
                        {...getTagProps({ index })}
                        sx={{
                          bgcolor: option.color,
                          color: 'white',
                        }}
                      />
                    ))
                  }
                />

                {/* Recurring */}
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={isRecurring}
                      onChange={(e) => setIsRecurring(e.target.checked)}
                    />
                  }
                  label="Повторяющаяся задача"
                />

                {isRecurring && (
                  <Box sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                    <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                      Настройка повторений
                    </Typography>
                    <RecurrenceRuleForm 
                      value={recurrenceRule ? { ...recurrenceRule, id: '', created_at: '' } as RecurrenceRule : null}
                      onChange={setRecurrenceRule} 
                    />
                  </Box>
                )}

                {/* Actions */}
                <Box display="flex" gap={2} justifyContent="flex-end">
                  <Button
                    variant="outlined"
                    onClick={handleCancel}
                    disabled={saving}
                    startIcon={<CancelIcon />}
                  >
                    Отмена
                  </Button>
                  <Button
                    type="submit"
                    variant="contained"
                    disabled={saving}
                    startIcon={saving ? <CircularProgress size={20} /> : <SaveIcon />}
                  >
                    {saving ? 'Сохранение...' : 'Сохранить'}
                  </Button>
                </Box>
              </Stack>
            </form>
          </CardContent>
        </Card>
      </Container>
    </LocalizationProvider>
  );
};

