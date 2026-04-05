'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
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
import { Plus, Wrench, Trash2, RotateCcw } from 'lucide-react';
import { formatDate } from '@/lib/utils';

export default function AssetsPage() {
  const [assets, setAssets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  const isAssetAdmin = user?.roles?.some((r: string) => ['Admin', 'HR', 'Asset Custodian'].includes(r));

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) setUser(JSON.parse(storedUser));

    const fetchAssets = async () => {
      setLoading(true);
      try {
        const res = await api.get('/assets?per_page=50');
        setAssets(res.data.data.data);
      } catch (error: any) {
        toast.error(error.response?.data?.message || 'Failed to fetch assets');
      } finally {
        setLoading(false);
      }
    };

    fetchAssets();
  }, []);

  const refreshAssets = async () => {
    setLoading(true);
    try {
      const res = await api.get('/assets?per_page=50');
      setAssets(res.data.data.data);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to fetch assets');
    } finally {
      setLoading(false);
    }
  };

  const handleAddAsset = async () => {
    try {
      const name = window.prompt('Asset name');
      if (!name) return;
      const asset_tag = window.prompt('Asset tag') || '';
      if (!asset_tag) return;
      const category = window.prompt('Category') || 'General';
      const purchase_cost = Number(window.prompt('Purchase cost (number)') || '0');

      await api.post('/assets', {
        name,
        asset_tag,
        category,
        purchase_cost,
      });
      toast.success('Asset created');
      await refreshAssets();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to add asset');
    }
  };

  const handleAssign = async (asset: any) => {
    try {
      const employee_id = Number(window.prompt('Employee ID (select from employees list) - provide numeric employee record id') || '0');
      if (!employee_id) return;
      const assigned_date = window.prompt('Assigned date (YYYY-MM-DD)', new Date().toISOString().slice(0, 10)) || new Date().toISOString().slice(0, 10);
      const due_date = window.prompt('Due date (optional YYYY-MM-DD)') || null;
      const assignment_notes = window.prompt('Notes (optional)') || null;

      await api.post(`/assets/${asset.id}/assign`, {
        employee_id,
        assigned_date,
        due_date,
        assignment_notes,
      });
      toast.success('Asset assigned');
      await refreshAssets();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to assign asset');
    }
  };

  const handleReturn = async (asset: any) => {
    try {
      const assignment = asset?.active_assignment;
      if (!assignment) return;
      const returned_date = window.prompt('Returned date (YYYY-MM-DD)', new Date().toISOString().slice(0, 10)) || new Date().toISOString().slice(0, 10);
      const return_notes = window.prompt('Return notes (optional)') || null;

      await api.post(`/asset-assignments/${assignment.id}/return`, {
        returned_date,
        return_notes,
      });
      toast.success('Asset returned');
      await refreshAssets();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to return asset');
    }
  };

  const handleMaintenance = async (asset: any) => {
    try {
      await api.post(`/assets/${asset.id}/maintenance`);
      toast.success('Asset moved to maintenance');
      await refreshAssets();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to move to maintenance');
    }
  };

  const handleDispose = async (asset: any) => {
    try {
      const return_notes = window.prompt('Disposal return notes (optional)') || null;
      await api.post(`/assets/${asset.id}/dispose`, { return_notes });
      toast.success('Asset disposed');
      await refreshAssets();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to dispose asset');
    }
  };

  const formatAssignee = (asset: any) => {
    const a = asset?.active_assignment;
    const emp = a?.employee;
    if (!emp) return '-';
    return `${emp.first_name} ${emp.last_name}`;
  };

  const renderAssetRow = (asset: any) => (
    <TableRow key={asset.id}>
      <TableCell className="font-mono">{asset.asset_tag}</TableCell>
      <TableCell className="font-medium">{asset.name}</TableCell>
      <TableCell>{asset.category}</TableCell>
      <TableCell>
        <Badge variant={asset.status === 'available' ? 'default' : 'secondary'}>
          {String(asset.status).toUpperCase()}
        </Badge>
      </TableCell>
      <TableCell>{formatAssignee(asset)}</TableCell>
      <TableCell>{formatDate(asset?.active_assignment?.due_date)}</TableCell>
      {isAssetAdmin && (
        <TableCell className="text-right">
          {asset.status === 'available' ? (
            <Button size="sm" variant="outline" onClick={() => handleAssign(asset)}>
              Assign
            </Button>
          ) : (
            <div className="flex justify-end gap-2">
              <Button size="sm" variant="outline" onClick={() => handleReturn(asset)} title="Return">
                <RotateCcw className="w-4 h-4" />
              </Button>
              <Button size="sm" variant="outline" onClick={() => handleMaintenance(asset)} title="Maintenance">
                <Wrench className="w-4 h-4" />
              </Button>
              <Button size="sm" variant="outline" onClick={() => handleDispose(asset)} title="Dispose">
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          )}
        </TableCell>
      )}
    </TableRow>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Assets</h1>
        <p className="text-gray-500">Asset inventory with current assignment.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center justify-between gap-3">
            <span>Asset List</span>
            {isAssetAdmin && (
              <Button size="sm" variant="outline" className="flex items-center gap-2" onClick={handleAddAsset}>
                <Plus className="w-4 h-4" />
                Add Asset
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Asset Tag</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Assigned To</TableHead>
                <TableHead>Due Date</TableHead>
                {isAssetAdmin && <TableHead className="text-right">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={isAssetAdmin ? 7 : 6} className="text-center py-10 text-gray-500">
                    Loading assets...
                  </TableCell>
                </TableRow>
              ) : assets.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={isAssetAdmin ? 7 : 6} className="text-center py-10 text-gray-500">
                    No assets found.
                  </TableCell>
                </TableRow>
              ) : (
                assets.map(renderAssetRow)
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

