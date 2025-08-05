
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
import type { 
  Pembayaran, 
  CreatePembayaranInput, 
  UpdatePembayaranInput, 
  MetodeBayar, 
  StatusPembayaran,
  Penyewa 
} from '../../../server/src/schema';

export function PembayaranManager() {
  const [pembayaran, setPembayaran] = useState<Pembayaran[]>([]);
  const [penyewa, setPenyewa] = useState<Penyewa[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPembayaran, setEditingPembayaran] = useState<Pembayaran | null>(null);

  const [formData, setFormData] = useState<CreatePembayaranInput>({
    penyewa_id: 0,
    bulan: '',
    jumlah: 0,
    tanggal_bayar: new Date(),
    metode_bayar: 'Transfer',
    bukti_bayar: null,
    status: 'Belum',
    keterangan: null
  });

  const loadPembayaran = useCallback(async () => {
    try {
      const result = await trpc.getPembayaran.query();
      setPembayaran(result);
    } catch (error) {
      console.error('Failed to load pembayaran:', error);
    }
  }, []);

  const loadPenyewa = useCallback(async () => {
    try {
      const result = await trpc.getPenyewa.query();
      setPenyewa(result);
    } catch (error) {
      console.error('Failed to load penyewa:', error);
    }
  }, []);

  useEffect(() => {
    loadPembayaran();
    loadPenyewa();
  }, [loadPembayaran, loadPenyewa]);

  const resetForm = () => {
    setFormData({
      penyewa_id: 0,
      bulan: '',
      jumlah: 0,
      tanggal_bayar: new Date(),
      metode_bayar: 'Transfer',
      bukti_bayar: null,
      status: 'Belum',
      keterangan: null
    });
    setEditingPembayaran(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      if (editingPembayaran) {
        const updateData: UpdatePembayaranInput = {
          id: editingPembayaran.id,
          ...formData
        };
        await trpc.updatePembayaran.mutate(updateData);
      } else {
        await trpc.createPembayaran.mutate(formData);
      }
      await loadPembayaran();
      resetForm();
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Failed to save pembayaran:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (pembayaranItem: Pembayaran) => {
    setEditingPembayaran(pembayaranItem);
    setFormData({
      penyewa_id: pembayaranItem.penyewa_id,
      bulan: pembayaranItem.bulan,
      jumlah: pembayaranItem.jumlah,
      tanggal_bayar: pembayaranItem.tanggal_bayar,
      metode_bayar: pembayaranItem.metode_bayar,
      bukti_bayar: pembayaranItem.bukti_bayar,
      status: pembayaranItem.status,
      keterangan: pembayaranItem.keterangan
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await trpc.deletePembayaran.mutate({ id });
      await loadPembayaran();
    } catch (error) {
      console.error('Failed to delete pembayaran:', error);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getStatusBadge = (status: StatusPembayaran) => {
    return status === 'Lunas' ? (
      <Badge variant="secondary" className="bg-green-100 text-green-800">
        ✅ Lunas
      </Badge>
    ) : (
      <Badge variant="secondary" className="bg-red-100 text-red-800">
        ⏳ Belum
      </Badge>
    );
  };

  const getMetodeBadge = (metode: MetodeBayar) => {
    return metode === 'Transfer' ? (
      <Badge variant="outline" className="bg-blue-50 text-blue-700">
        🏦 Transfer
      </Badge>
    ) : (
      <Badge variant="outline" className="bg-green-50 text-green-700">
        💵 Tunai
      </Badge>
    );
  };

  const getPenyewaName = (penyewaId: number) => {
    const penyewaItem = penyewa.find((p: Penyewa) => p.id === penyewaId);
    return penyewaItem ? penyewaItem.nama_lengkap : 'N/A';
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('id-ID');
  };

  const formatDateForInput = (date: Date) => {
    return new Date(date).toISOString().split('T')[0];
  };

  const generateMonthOptions = () => {
    const months = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    const currentYear = new Date().getFullYear();
    const options = [];
    
    for (let year = currentYear - 1; year <= currentYear + 1; year++) {
      for (const month of months) {
        options.push(`${month} ${year}`);
      }
    }
    
    return options;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Manajemen Pembayaran</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm} className="bg-purple-600 hover:bg-purple-700">
              ➕ Tambah Pembayaran
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingPembayaran ? 'Edit Pembayaran' : 'Tambah Pembayaran Baru'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="penyewa_id">Penyewa</Label>
                <Select
                  value={formData.penyewa_id.toString()}
                  onValueChange={(value: string) =>
                    setFormData((prev: CreatePembayaranInput) => ({ ...prev, penyewa_id: parseInt(value) }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih penyewa" />
                  </SelectTrigger>
                  <SelectContent>
                    {penyewa.filter((p: Penyewa) => p.status === 'Aktif').map((penyewaItem: Penyewa) => (
                      <SelectItem key={penyewaItem.id} value={penyewaItem.id.toString()}>
                        {penyewaItem.nama_lengkap}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="bulan">Bulan</Label>
                <Select
                  value={formData.bulan}
                  onValueChange={(value: string) =>
                    setFormData((prev: CreatePembayaranInput) => ({ ...prev, bulan: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih bulan" />
                  </SelectTrigger>
                  <SelectContent>
                    {generateMonthOptions().map((month: string) => (
                      <SelectItem key={month} value={month}>
                        {month}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="jumlah">Jumlah Pembayaran</Label>
                <Input
                  id="jumlah"
                  type="number"
                  value={formData.jumlah}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData((prev: CreatePembayaranInput) => ({ ...prev, jumlah: parseInt(e.target.value) || 0 }))
                  }
                  placeholder="500000"
                  min="0"
                  required
                />
              </div>

              <div>
                <Label htmlFor="tanggal_bayar">Tanggal Bayar</Label>
                <Input
                  id="tanggal_bayar"
                  type="date"
                  value={formatDateForInput(formData.tanggal_bayar)}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData((prev: CreatePembayaranInput) => ({ ...prev, tanggal_bayar: new Date(e.target.value) }))
                  }
                  required
                />
              </div>

              <div>
                <Label htmlFor="metode_bayar">Metode Bayar</Label>
                <Select
                  value={formData.metode_bayar}
                  onValueChange={(value: MetodeBayar) =>
                    setFormData((prev: CreatePembayaranInput) => ({ ...prev, metode_bayar: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Transfer">Transfer</SelectItem>
                    <SelectItem value="Tunai">Tunai</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="bukti_bayar">Bukti Bayar (URL/Path)</Label>
                <Input
                  id="bukti_bayar"
                  value={formData.bukti_bayar || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData((prev: CreatePembayaranInput) => ({
                      ...prev,
                      bukti_bayar: e.target.value || null
                    }))
                  }
                  placeholder="https://example.com/bukti.jpg"
                  maxLength={255}
                />
              </div>

              <div>
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: StatusPembayaran) =>
                    setFormData((prev: CreatePembayaranInput) => ({ ...prev, status: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Belum">Belum</SelectItem>
                    <SelectItem value="Lunas">Lunas</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="keterangan">Keterangan</Label>
                <Textarea
                  id="keterangan"
                  value={formData.keterangan || ''}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    setFormData((prev: CreatePembayaranInput) => ({
                      ...prev,
                      keterangan: e.target.value || null
                    }))
                  }
                  placeholder="Keterangan tambahan..."
                />
              </div>

              <Button type="submit" disabled={isLoading} className="w-full">
                {isLoading ? 'Menyimpan...' : editingPembayaran ? 'Update Pembayaran' : 'Tambah Pembayaran'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {pembayaran.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-gray-500">Belum ada pembayaran yang tercatat. Tambah pembayaran pertama Anda!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {pembayaran.map((pembayaranItem: Pembayaran) => (
            <Card key={pembayaranItem.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">
                    💰 {pembayaranItem.bulan}
                  </CardTitle>
                  {getStatusBadge(pembayaranItem.status)}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Penyewa:</span>
                    <span className="font-semibold">
                      {getPenyewaName(pembayaranItem.penyewa_id)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Jumlah:</span>
                    <span className="font-bold text-green-600">
                      {formatCurrency(pembayaranItem.jumlah)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Tanggal:</span>
                    <span className="text-sm">{formatDate(pembayaranItem.tanggal_bayar)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Metode:</span>
                    {getMetodeBadge(pembayaranItem.metode_bayar)}
                  </div>
                  {pembayaranItem.bukti_bayar && (
                    <div>
                      <span className="text-sm text-gray-600 block mb-1">Bukti Bayar:</span>
                      <a 
                        href={pembayaranItem.bukti_bayar} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline"
                      >
                        Lihat Bukti
                      </a>
                    </div>
                  )}
                  {pembayaranItem.keterangan && (
                    <div>
                      <span className="text-sm text-gray-600 block mb-1">Keterangan:</span>
                      <p className="text-sm bg-gray-50 p-2 rounded">{pembayaranItem.keterangan}</p>
                    </div>
                  )}
                </div>
                <div className="flex justify-between pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(pembayaranItem)}
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
                        <AlertDialogTitle>Hapus Pembayaran</AlertDialogTitle>
                        <AlertDialogDescription>
                          Apakah Anda yakin ingin menghapus pembayaran {pembayaranItem.bulan} ini? 
                          Tindakan ini tidak dapat dibatalkan.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Batal</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(pembayaranItem.id)}
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
