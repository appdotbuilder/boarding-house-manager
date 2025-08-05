
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { trpc } from '@/utils/trpc';
import { useState, useEffect, useCallback } from 'react';
import type { Kamar, CreateKamarInput, UpdateKamarInput, StatusKamar } from '../../../server/src/schema';

export function KamarManager() {
  const [kamar, setKamar] = useState<Kamar[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingKamar, setEditingKamar] = useState<Kamar | null>(null);

  const [formData, setFormData] = useState<CreateKamarInput>({
    nomor_kamar: '',
    harga_sewa: 0,
    kapasitas: 1,
    fasilitas: null,
    status: 'Kosong',
    catatan: null
  });

  const loadKamar = useCallback(async () => {
    try {
      const result = await trpc.getKamar.query();
      setKamar(result);
    } catch (error) {
      console.error('Failed to load kamar:', error);
    }
  }, []);

  useEffect(() => {
    loadKamar();
  }, [loadKamar]);

  const resetForm = () => {
    setFormData({
      nomor_kamar: '',
      harga_sewa: 0,
      kapasitas: 1,
      fasilitas: null,
      status: 'Kosong',
      catatan: null
    });
    setEditingKamar(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      if (editingKamar) {
        const updateData: UpdateKamarInput = {
          id: editingKamar.id,
          ...formData
        };
        await trpc.updateKamar.mutate(updateData);
      } else {
        await trpc.createKamar.mutate(formData);
      }
      await loadKamar();
      resetForm();
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Failed to save kamar:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (kamarItem: Kamar) => {
    setEditingKamar(kamarItem);
    setFormData({
      nomor_kamar: kamarItem.nomor_kamar,
      harga_sewa: kamarItem.harga_sewa,
      kapasitas: kamarItem.kapasitas,
      fasilitas: kamarItem.fasilitas,
      status: kamarItem.status,
      catatan: kamarItem.catatan
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await trpc.deleteKamar.mutate({ id });
      await loadKamar();
    } catch (error) {
      console.error('Failed to delete kamar:', error);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getStatusBadge = (status: StatusKamar) => {
    return status === 'Kosong' ? (
      <Badge variant="secondary" className="bg-green-100 text-green-800">
        🟢 Kosong
      </Badge>
    ) : (
      <Badge variant="secondary" className="bg-red-100 text-red-800">
        🔴 Terisi
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Manajemen Kamar</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm} className="bg-blue-600 hover:bg-blue-700">
              ➕ Tambah Kamar
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingKamar ? 'Edit Kamar' : 'Tambah Kamar Baru'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="nomor_kamar">Nomor Kamar</Label>
                <Input
                  id="nomor_kamar"
                  value={formData.nomor_kamar}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData((prev: CreateKamarInput) => ({ ...prev, nomor_kamar: e.target.value }))
                  }
                  placeholder="A01, B02, dll."
                  maxLength={10}
                  required
                />
              </div>

              <div>
                <Label htmlFor="harga_sewa">Harga Sewa (per bulan)</Label>
                <Input
                  id="harga_sewa"
                  type="number"
                  value={formData.harga_sewa}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData((prev: CreateKamarInput) => ({ ...prev, harga_sewa: parseInt(e.target.value) || 0 }))
                  }
                  placeholder="500000"
                  min="0"
                  required
                />
              </div>

              <div>
                <Label htmlFor="kapasitas">Kapasitas</Label>
                <Input
                  id="kapasitas"
                  type="number"
                  value={formData.kapasitas}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData((prev: CreateKamarInput) => ({ ...prev, kapasitas: parseInt(e.target.value) || 1 }))
                  }
                  min="1"
                  required
                />
              </div>

              <div>
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: StatusKamar) =>
                    setFormData((prev: CreateKamarInput) => ({ ...prev, status: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Kosong">Kosong</SelectItem>
                    <SelectItem value="Terisi">Terisi</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="fasilitas">Fasilitas</Label>
                <Textarea
                  id="fasilitas"
                  value={formData.fasilitas || ''}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    setFormData((prev: CreateKamarInput) => ({
                      ...prev,
                      fasilitas: e.target.value || null
                    }))
                  }
                  placeholder="AC, Kamar mandi dalam, WiFi, dll."
                />
              </div>

              <div>
                <Label htmlFor="catatan">Catatan</Label>
                <Textarea
                  id="catatan"
                  value={formData.catatan || ''}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    setFormData((prev: CreateKamarInput) => ({
                      ...prev,
                      catatan: e.target.value || null
                    }))
                  }
                  placeholder="Catatan tambahan..."
                />
              </div>

              <Button type="submit" disabled={isLoading} className="w-full">
                {isLoading ? 'Menyimpan...' : editingKamar ? 'Update Kamar' : 'Tambah Kamar'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {kamar.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-gray-500">Belum ada kamar yang terdaftar. Tambah kamar pertama Anda!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {kamar.map((kamarItem: Kamar) => (
            <Card key={kamarItem.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">
                    🏠 Kamar {kamarItem.nomor_kamar}
                  </CardTitle>
                  {getStatusBadge(kamarItem.status)}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Harga Sewa:</span>
                  <span className="font-semibold text-blue-600">
                    {formatCurrency(kamarItem.harga_sewa)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Kapasitas:</span>
                  <span className="font-semibold">{kamarItem.kapasitas} orang</span>
                </div>
                {kamarItem.fasilitas && (
                  <div>
                    <span className="text-sm text-gray-600 block mb-1">Fasilitas:</span>
                    <p className="text-sm bg-gray-50 p-2 rounded">{kamarItem.fasilitas}</p>
                  </div>
                )}
                {kamarItem.catatan && (
                  <div>
                    <span className="text-sm text-gray-600 block mb-1">Catatan:</span>
                    <p className="text-sm bg-yellow-50 p-2 rounded">{kamarItem.catatan}</p>
                  </div>
                )}
                <div className="flex justify-between pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(kamarItem)}
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
                        <AlertDialogTitle>Hapus Kamar</AlertDialogTitle>
                        <AlertDialogDescription>
                          Apakah Anda yakin ingin menghapus kamar {kamarItem.nomor_kamar}? 
                          Tindakan ini tidak dapat dibatalkan.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Batal</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(kamarItem.id)}
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
