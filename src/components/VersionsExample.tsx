import { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Alert,
  List,
  ListItem,
  ListItemText,
  Chip,
} from '@mui/material';
import { apiRequest } from '../utils/api';

interface AppVersion {
  id: number;
  version: string;
  description: string | null;
  released_at: string;
  created_at: string;
  updated_at: string;
}

interface VersionsResponse {
  success: boolean;
  data: AppVersion[];
  count: number;
}

/**
 * Example component showing how to use protected API routes
 * This component fetches data from authenticated endpoints
 */
export const VersionsExample = () => {
  const [versions, setVersions] = useState<AppVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchVersions();
  }, []);

  const fetchVersions = async () => {
    try {
      setLoading(true);
      setError('');
      
      // apiRequest automatically adds Bearer token from localStorage
      const response = await apiRequest<VersionsResponse>('/versions');
      
      setVersions(response.data);
    } catch (err: any) {
      console.error('Error fetching versions:', err);
      setError(err.message || 'Failed to fetch versions');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h5" component="h2">
            App Versions
          </Typography>
          <Chip label={`${versions.length} versions`} color="primary" size="small" />
        </Box>

        {versions.length === 0 ? (
          <Typography color="text.secondary">
            No versions found
          </Typography>
        ) : (
          <List>
            {versions.map((version) => (
              <ListItem key={version.id} divider>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="subtitle1" fontWeight={600}>
                        v{version.version}
                      </Typography>
                      <Chip 
                        label={new Date(version.released_at).toLocaleDateString()} 
                        size="small" 
                        variant="outlined"
                      />
                    </Box>
                  }
                  secondary={version.description || 'No description'}
                />
              </ListItem>
            ))}
          </List>
        )}
      </CardContent>
    </Card>
  );
};

