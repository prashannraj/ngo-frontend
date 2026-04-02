'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { toast } from 'sonner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function ProjectsPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [paginationInfo, setPaginationInfo] = useState<any>(null);

  useEffect(() => {
    const fetchProjects = async () => {
      setLoading(true);
      try {
        const res = await api.get('/projects?per_page=25');
        setProjects(res.data.data.data);
        setPaginationInfo(res.data.data);
      } catch (error: any) {
        toast.error(error.response?.data?.message || 'Failed to fetch projects');
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Projects</h1>
        <p className="text-gray-500">View project status and assigned project manager.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Project List</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Manager</TableHead>
                <TableHead>Start</TableHead>
                <TableHead>End</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-10 text-gray-500">
                    Loading projects...
                  </TableCell>
                </TableRow>
              ) : projects.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-10 text-gray-500">
                    No projects found.
                  </TableCell>
                </TableRow>
              ) : (
                projects.map((project: any) => (
                  <TableRow key={project.id}>
                    <TableCell className="font-mono">{project.code}</TableCell>
                    <TableCell className="font-medium">{project.name}</TableCell>
                    <TableCell>
                      {project.manager ? `${project.manager.first_name} ${project.manager.last_name}` : '-'}
                    </TableCell>
                    <TableCell>{project.start_date}</TableCell>
                    <TableCell>{project.end_date || '-'}</TableCell>
                    <TableCell>
                      <Badge variant={project.status === 'completed' ? 'default' : 'secondary'}>
                        {String(project.status).toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="outline" onClick={() => router.push(`/dashboard/projects/${project.id}`)}>
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {paginationInfo && (
            <div className="mt-4 text-sm text-gray-500">
              Page {paginationInfo.current_page} of {paginationInfo.last_page} (Total: {paginationInfo.total})
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

