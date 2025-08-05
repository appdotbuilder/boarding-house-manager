
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { KamarManager } from '@/components/KamarManager';
import { PenyewaManager } from '@/components/PenyewaManager';
import { PembayaranManager } from '@/components/PembayaranManager';
import './App.css';

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto p-6">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">🏠 Sistem Manajemen Kos</h1>
          <p className="text-gray-600">Kelola kamar, penyewa, dan pembayaran dengan mudah</p>
        </div>

        <Tabs defaultValue="kamar" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="kamar" className="text-lg">
              🏠 Kamar
            </TabsTrigger>
            <TabsTrigger value="penyewa" className="text-lg">
              👥 Penyewa
            </TabsTrigger>
            <TabsTrigger value="pembayaran" className="text-lg">
              💰 Pembayaran
            </TabsTrigger>
          </TabsList>

          <TabsContent value="kamar">
            <KamarManager />
          </TabsContent>

          <TabsContent value="penyewa">
            <PenyewaManager />
          </TabsContent>

          <TabsContent value="pembayaran">
            <PembayaranManager />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default App;
