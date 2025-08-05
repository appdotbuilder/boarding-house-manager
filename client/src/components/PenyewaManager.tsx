
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { trpc } from '@/utils/trpc';
import { useState, useEffect, useCallback } from 'react';
import type { Penyewa, CreatePenyewaInput, UpdatePenyewaInput, StatusPenyewa, Kamar } from '../../../server/src/schema';

export function PenyewaManager() {
  const [penyewa, setPenyewa] = useState<Penyewa[]>([]);
  const [kamar, setKamar] = useState<Kamar[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPenyewa, setEditingPenyewa] = useState<Penyewa | null>(null);

  const [formData, setFormData] = useState<CreatePenyewaInput>({
    nama_lengkap: '',
    no_telepon: '',
    email: '',
    nomor_ktp: '',
    alamat_asal: '',
    kamar_id: 0,
    tgl_masuk: new Date(),
    tgl_keluar: null,
    status: 'Aktif'
  });

  const loadPenyewa = useCallback(async () => {
    try {
      const result = await trpc.getPenyewa.query();
      setPenyewa(result);
    } catch (error) {
      console.error('Failed to load penyewa:', error);
    }
  }, []);

  const loadKamar = useCallback(async () => {
    try {
      const result = await trpc.getKamar.query();
      setKamar(result);
    } catch (error) {
      console.error('Failed to load kamar:', error);
    }
  }, []);

  useEffect(() => {
    loadPenyewa();
    loadKamar();
  }, [loadPenyewa, loadKamar]);

  const resetForm = () => {
    setFormData({
      nama_lengkap: '',
      no_telepon: '',
      email: '',
      nomor_ktp: '',
      alamat_asal: '',
      kamar_id: 0,
      tgl_masuk: new Date(),
      tgl_keluar: null,
      status: 'Aktif'
    });
    setEditingPenyewa(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      if (editingPenyewa) {
        const updateData: UpdatePenyewaInput = {
          id: editingPenyewa.id,
          ...formData
        };
        await trpc.updatePenyewa.mutate(updateData);
      } else {
        await trpc.createPenyewa.mutate(formData);
      }
      await loadPenyewa();
      resetForm();
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Failed to save penyewa:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (penyewaItem: Penyewa) => {
    setEditingPenyewa(penyewaItem);
    setFormData({
      nama_lengkap: penyewaItem.nama_lengkap,
      no_telepon: penyewaItem.no_telepon,
      email: penyewaItem.email,
      nomor_ktp: penyewaItem.nomor_ktp,
      alamat_asal: penyewaItem.alamat_asal,
      kamar_id: penyewaItem.kamar_id,
      tgl_masuk: penyewaItem.tgl_masuk,
      tgl_keluar: penyewaItem.tgl_keluar,
      status: penyewaItem.status
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await trpc.deletePenyewa.mutate({ id });
      await loadPenyewa();
    } catch (error) {
      console.error('Failed to delete penyewa:', error);
    }
  };

  const getStatusBadge = (status: StatusPenyewa) => {
    return status === 'Aktif' ? (
      <Badge variant="secondary" className="bg-green-100 text-green-800">
        ✅ Aktif
      </Badge>
    ) : (
      <Badge variant="secondary" className="bg-gray-100 text-gray-800">
        ❌ Keluar
      </Badge>
    );
  };

  const getKamarName = (kamarId: number) => {
    const kamarItem = kamar.find((k: Kamar) => k.id === kamarId);
    return kamarItem ? kamarItem.nomor_kamar : 'N/A';
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('id-ID');
  };

  const formatDateForInput = (date: Date | null) => {
    if (!date) return '';
    return new Date(date).toISOString().split('T')[0];
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Manajemen Penyewa</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm} className="bg-green-600 hover:bg-green-700">
              ➕ Tambah Penyewa
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingPenyewa ? 'Edit Penyewa' : 'Tambah Penyewa Baru'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="nama_lengkap">Nama Lengkap</Label>
                <Input
                  id="nama_lengkap"
                  value={formData.nama_lengkap}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData((prev: CreatePenyewaInput) => ({ ...prev, nama_lengkap: e.target.value }))
                  }
                  placeholder="John Doe"
                  maxLength={100}
                  required
                />
              </div>

              <div>
                <Label htmlFor="no_telepon">No. Telepon</Label>
                <Input
                  id="no_telepon"
                  value={formData.no_telepon}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData((prev: CreatePenyewaInput) => ({ ...prev, no_telepon: e.target.value }))
                  }
                  placeholder="081234567890"
                  maxLength={15}
                  required
                />
              </div>

              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData((prev: CreatePenyewaInput) => ({ ...prev, email: e.target.value }))
                  }
                  placeholder="john@example.com"
                  maxLength={100}
                  required
                />
              </div>

              <div>
                <Label htmlFor="nomor_ktp">Nomor KTP</Label>
                <Input
                  id="nomor_ktp"
                  value={formData.nomor_ktp}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData((prev: CreatePenyewaInput) => ({ ...prev, nomor_ktp: e.target.value }))
                  }
                  placeholder="1234567890123456"
                  maxLength={20}
                  required
                />
              </div>

              <div>
                <Label htmlFor="alamat_asal">Alamat Asal</Label>
                <Input
                  id="alamat_asal"
                  value={formData.alamat_asal}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData((prev: CreatePenyewaInput) => ({ ...prev, alamat_asal: e.target.value }))
                  }
                  placeholder="Jl. Contoh No. 123, Jakarta"
                  required
                />
              </div>

              <div>
                <Label htmlFor="kamar_id">Kamar</Label>
                <Select
                  value={formData.kamar_id.toString()}
                  onValueChange={(value: string) =>
                    setFormData((prev: CreatePenyewaInput) => ({ ...prev, kamar_id: parseInt(value) }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih kamar" />
                  </SelectTrigger>
                  <SelectContent>
                    {kamar.map((kamarItem: Kamar) => (
                      <SelectItem key={kamarItem.id} value={kamarItem.id.toString()}>
                        Kamar {kamarItem.nomor_kamar} - {kamarItem.status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="tgl_masuk">Tanggal Masuk</Label>
                <Input
                  id="tgl_masuk"
                  type="date"
                  value={formatDateForInput(formData.tgl_masuk)}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData((prev: CreatePenyewaInput) => ({ ...prev, tgl_masuk: new Date(e.target.value) }))
                  }
                  required
                />
              </div>

              <div>
                <Label htmlFor="tgl_keluar">Tanggal Keluar (Opsional)</Label>
                <Input
                  id="tgl_keluar"
                  type="date"
                  value={formatDateForInput(formData.tgl_keluar)}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData((prev: CreatePenyewaInput) => ({
                      ...prev,
                      tgl_keluar: e.target.value ? new Date(e.target.value) : null
                    }))
                  }
                />
              </div>

              <div>
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: StatusPenyewa) =>
                    setFormData((prev: CreatePenyewaInput) => ({ ...prev, status: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Aktif">Aktif</SelectItem>
                    <SelectItem value="Keluar">Keluar</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button type="submit" disabled={isLoading} className="w-full">
                {isLoading ? 'Menyimpan...' : editingPenyewa ? 'Update Penyewa' : 'Tambah Penyewa'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {penyewa.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-gray-500">Belum ada penyewa yang terdaftar. Tambah penyewa pertama Anda!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {penyewa.map((penyewaItem: Penyewa) => (
            <Card key={penyewaItem.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">
                    👤 {penyewaItem.nama_lengkap}
                  </CardTitle>
                  {getStatusBadge(penyewaItem.status)}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Kamar:</span>
                    <span className="font-semibold">
                      🏠 {getKamarName(penyewaItem.kamar_id)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Telepon:</span>
                    <span className="text-sm">{penyewaItem.no_telepon}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Email:</span>
                    <span className="text-sm">{penyewaItem.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">KTP:</span>
                    <span className="text-sm">{penyewaItem.nomor_ktp}</span>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600 block mb-1">Alamat Asal:</span>
                    <p className="text-sm bg-gray-50 p-2 rounded">{penyewaItem.alamat_asal}</p>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Masuk:</span>
                    <span className="text-sm">{formatDate(penyewaItem.tgl_masuk)}</span>
                  </div>
                  {penyewaItem.tgl_keluar && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Keluar:</span>
                      <span className="text-sm">{formatDate(penyewaItem.tgl_keluar)}</span>
                    </div>
                  )}
                </div>
                <div className="flex justify-between pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(penyewaItem)}
                  >
                    ✏️ Edit
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                        🗑️ Hapus
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Hapus Penyewa</AlertDialogTitle>
                        <AlertDialogDescription>
                          Apakah Anda yakin ingin menghapus data penyewa {penyewaItem.nama_lengkap}? 
                          Tindakan ini tidak dapat dibatalkan.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Batal</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(penyewaItem.id)}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          Hapus
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
