'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { toast } from 'sonner';
import { formatDate, formatDateTime } from '@/lib/utils';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Check, Plus, X } from 'lucide-react';

export default function FleetPage() {
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  const isFleetApprover = user?.roles?.some((r: string) => ['Admin', 'HR', 'Fleet Manager'].includes(r));
  const isEmployee = user?.roles?.some((r: string) => r === 'Employee');

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) setUser(JSON.parse(storedUser));

    const fetchAll = async () => {
      setLoading(true);
      try {
        const [vehRes, reqRes] = await Promise.all([
          api.get('/vehicles?per_page=25'),
          api.get('/vehicle-requests?per_page=25'),
        ]);

        setVehicles(vehRes.data.data.data);
        setRequests(reqRes.data.data.data);
      } catch (error: any) {
        toast.error(error.response?.data?.message || 'Failed to fetch fleet data');
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, []);

  const refreshAll = async () => {
    setLoading(true);
    try {
      const [vehRes, reqRes] = await Promise.all([
        api.get('/vehicles?per_page=25'),
        api.get('/vehicle-requests?per_page=25'),
      ]);
      setVehicles(vehRes.data.data.data);
      setRequests(reqRes.data.data.data);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to fetch fleet data');
    } finally {
      setLoading(false);
    }
  };

  const handleAddVehicle = async () => {
    try {
      const name = window.prompt('Vehicle name (required)') || '';
      if (!name.trim()) return;
      const model = window.prompt('Model (required)') || '';
      if (!model.trim()) return;
      const license_plate = window.prompt('License Plate (required)') || '';
      if (!license_plate.trim()) return;
      const type = window.prompt('Type (Car/Bike/Truck/etc) (required)') || 'Car';
      const fuel_type = window.prompt('Fuel type (optional)') || '';
      const seating_capacity = Number(window.prompt('Seating capacity (optional number)') || '0');

      await api.post('/vehicles', {
        name,
        model,
        license_plate,
        type,
        fuel_type: fuel_type || null,
        seating_capacity: seating_capacity || null,
      });

      toast.success('Vehicle registered');
      await refreshAll();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to add vehicle');
    }
  };

  const handleRequestVehicle = async () => {
    try {
      const destination = window.prompt('Destination (required)') || '';
      if (!destination.trim()) return;
      const purpose = window.prompt('Purpose (required)') || '';
      if (!purpose.trim()) return;
      const start_time = window.prompt('Start time (YYYY-MM-DDTHH:mm)') || '';
      if (!start_time.trim()) return;
      const end_time = window.prompt('End time (YYYY-MM-DDTHH:mm)') || '';
      if (!end_time.trim()) return;

      // Optional: choose vehicle now or let approver decide.
      const vehicle_id_raw = window.prompt('Vehicle ID (optional numeric) - leave empty for none') || '';
      const vehicle_id = vehicle_id_raw.trim() ? Number(vehicle_id_raw) : null;

      await api.post('/vehicle-requests', {
        vehicle_id,
        destination,
        purpose,
        start_time,
        end_time,
      });

      toast.success('Vehicle request submitted');
      await refreshAll();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to request vehicle');
    }
  };

  const handleApprove = async (id: number) => {
    try {
      await api.post(`/vehicle-requests/${id}/approve`);
      toast.success('Vehicle request approved');
      await refreshAll();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to approve');
    }
  };

  const handleReject = async (id: number) => {
    try {
      await api.post(`/vehicle-requests/${id}/reject`);
      toast.success('Vehicle request rejected');
      await refreshAll();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to reject');
    }
  };

  const handleComplete = async (id: number) => {
    try {
      const start_odometer = Number(window.prompt('Start odometer (optional number)') || '0');
      const end_odometer = Number(window.prompt('End odometer (optional number)') || '0');

      await api.post(`/vehicle-requests/${id}/complete`, {
        start_odometer: start_odometer || null,
        end_odometer: end_odometer || null,
      });
      toast.success('Vehicle request completed');
      await refreshAll();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to complete');
    }
  };

  const statusBadgeVariant = (status: string) => {
    if (status === 'approved' || status === 'completed' || status === 'available') return 'default';
    if (status === 'pending' || status === 'assigned') return 'secondary';
    if (status === 'rejected' || status === 'out_of_service' || status === 'maintenance') return 'destructive';
    return 'secondary';
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Fleet</h1>
        <p className="text-gray-500">Vehicles and vehicle request workflow.</p>
      </div>

      <div className="flex justify-end gap-3">
        {isEmployee && (
          <Button onClick={handleRequestVehicle} className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Request Vehicle
          </Button>
        )}
        {isFleetApprover && (
          <Button variant="outline" onClick={handleAddVehicle} className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Register Vehicle
          </Button>
        )}
      </div>

      <Tabs defaultValue="vehicles">
        <TabsList>
          <TabsTrigger value="vehicles">Vehicles</TabsTrigger>
          <TabsTrigger value="requests">Vehicle Requests</TabsTrigger>
        </TabsList>

        <TabsContent value="vehicles" className="pt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Vehicle Inventory</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Model</TableHead>
                    <TableHead>License Plate</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-10 text-gray-500">
                        Loading vehicles...
                      </TableCell>
                    </TableRow>
                  ) : vehicles.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-10 text-gray-500">
                        No vehicles found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    vehicles.map((v: any) => (
                      <TableRow key={v.id}>
                        <TableCell className="font-medium">{v.name}</TableCell>
                        <TableCell>{v.model || '-'}</TableCell>
                        <TableCell className="font-mono">{v.license_plate}</TableCell>
                        <TableCell>{v.type}</TableCell>
                        <TableCell>
                          <Badge variant={statusBadgeVariant(v.status)}>{String(v.status).toUpperCase()}</Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="requests" className="pt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Vehicle Requests</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Destination</TableHead>
                    <TableHead>Vehicle</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Start</TableHead>
                    <TableHead>End</TableHead>
                    {isFleetApprover && <TableHead className="text-right">Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={isFleetApprover ? 7 : 6} className="text-center py-10 text-gray-500">
                        Loading requests...
                      </TableCell>
                    </TableRow>
                  ) : requests.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={isFleetApprover ? 7 : 6} className="text-center py-10 text-gray-500">
                        No vehicle requests found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    requests.map((r: any) => (
                      <TableRow key={r.id}>
                        <TableCell>
                          {r.employee ? `${r.employee.first_name} ${r.employee.last_name}` : '-'}
                        </TableCell>
                        <TableCell className="max-w-[240px] truncate">{r.destination}</TableCell>
                        <TableCell>{r.vehicle ? `${r.vehicle.name} (${r.vehicle.license_plate})` : '-'}</TableCell>
                        <TableCell>
                          <Badge variant={statusBadgeVariant(r.status)}>{String(r.status).toUpperCase()}</Badge>
                        </TableCell>
                        <TableCell>{formatDateTime(r.start_time)}</TableCell>
                        <TableCell>{formatDateTime(r.end_time)}</TableCell>
                        {isFleetApprover && (
                          <TableCell className="text-right">
                            {r.status === 'pending' ? (
                              <div className="flex justify-end gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-green-600 border-green-200 hover:bg-green-50"
                                  onClick={() => handleApprove(r.id)}
                                >
                                  <Check className="w-4 h-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-red-600 border-red-200 hover:bg-red-50"
                                  onClick={() => handleReject(r.id)}
                                >
                                  <X className="w-4 h-4" />
                                </Button>
                              </div>
                            ) : r.status === 'approved' ? (
                              <Button size="sm" variant="outline" onClick={() => handleComplete(r.id)}>
                                Complete
                              </Button>
                            ) : (
                              <span className="text-gray-400 text-xs">-</span>
                            )}
                          </TableCell>
                        )}
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

