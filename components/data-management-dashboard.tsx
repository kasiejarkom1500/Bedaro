import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  BarChart3, 
  Database, 
  FileText, 
  User, 
  Calendar,
  Activity,
  Info,
  TrendingUp,
  Settings,
  BookOpen
} from "lucide-react";
import { DataManagementStats } from "./data-management-stats";
import { IndicatorManagement } from "./indicator-management";
import { IndicatorDataManagement } from "./indicator-data-management";

interface DataManagementDashboardProps {
  category: string;
  userRole: string;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  onSessionUpdate?: () => void;
}

export function DataManagementDashboard({ 
  category, 
  userRole, 
  activeTab = "overview", 
  onTabChange,
  onSessionUpdate 
}: DataManagementDashboardProps) {

  // Debug logging
  console.log('DataManagementDashboard props:', { 
    category, 
    userRole, 
    activeTab, 
    hasOnTabChange: !!onTabChange 
  });

  const getCategoryDisplayName = (kategori: string) => {
    switch (kategori) {
      case 'Statistik Ekonomi':
        return 'Data Ekonomi';
      case 'Statistik Demografi & Sosial':
        return 'Data Demografi & Sosial';
      case 'Statistik Lingkungan Hidup & Multi-Domain':
        return 'Data Lingkungan & Multi-Domain';
      default:
        return kategori;
    }
  };

  const getCategoryIcon = (kategori: string) => {
    switch (kategori) {
      case 'Statistik Ekonomi':
        return <TrendingUp className="h-4 w-4" />;
      case 'Statistik Demografi & Sosial':
        return <User className="h-4 w-4" />;
      case 'Statistik Lingkungan Hidup & Multi-Domain':
        return <Activity className="h-4 w-4" />;
      default:
        return <BarChart3 className="h-4 w-4" />;
    }
  };

  const getCategoryDescription = (kategori: string) => {
    switch (kategori) {
      case 'Statistik Ekonomi':
        return 'Kelola data statistik ekonomi dan keuangan daerah';
      case 'Statistik Demografi & Sosial':
        return 'Kelola data kependudukan dan statistik sosial';
      case 'Statistik Lingkungan Hidup & Multi-Domain':
        return 'Kelola data lingkungan hidup dan multi sektor';
      default:
        return 'Kelola data statistik';
    }
  };

  const getCategoryColor = (kategori: string) => {
    switch (kategori) {
      case 'Statistik Ekonomi':
        return 'bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100';
      case 'Statistik Demografi & Sosial':
        return 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100';
      case 'Statistik Lingkungan Hidup & Multi-Domain':
        return 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100';
      default:
        return 'bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100';
    }
  };

  const getUserRoleDisplayName = (role: string) => {
    switch (role) {
      case 'admin_ekonomi':
        return 'Administrator Ekonomi';
      case 'admin_demografi':
        return 'Administrator Demografi';
      case 'admin_lingkungan':
        return 'Administrator Lingkungan';
      case 'superadmin':
        return 'Super Administrator';
      default:
        return role;
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Welcome Header */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-orange-500 via-orange-600 to-red-500 p-8 text-white">
        <div className="relative z-10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 mb-2">
                {getCategoryIcon(category)}
                <h1 className="text-3xl font-bold">Pusat Pengelolaan Data</h1>
              </div>
              <p className="text-orange-100 text-lg">
                {getCategoryDescription(category)}
              </p>
              <div className="flex items-center gap-2 text-sm text-orange-200">
                <Calendar className="h-4 w-4" />
                Selamat datang, {getUserRoleDisplayName(userRole)}
              </div>
            </div>
            <div className="flex flex-col gap-3 sm:items-end">
              <Badge className="bg-white/20 text-white border-white/30 backdrop-blur-sm">
                <span className="flex items-center gap-2">
                  {getCategoryIcon(category)}
                  {getCategoryDisplayName(category)}
                </span>
              </Badge>
              <Badge variant="outline" className="bg-white/10 text-white border-white/30 backdrop-blur-sm">
                <User className="h-3 w-3 mr-1" />
                {getUserRoleDisplayName(userRole)}
              </Badge>
            </div>
          </div>
        </div>
        {/* Background decoration */}
        <div className="absolute -top-4 -right-4 h-24 w-24 rounded-full bg-white/10"></div>
        <div className="absolute -bottom-6 -left-6 h-32 w-32 rounded-full bg-white/5"></div>
      </div>

      {/* Main Navigation */}
      <Tabs value={activeTab} onValueChange={onTabChange} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 bg-gray-50 p-1 rounded-lg h-auto">
          <TabsTrigger 
            value="overview" 
            className="flex flex-col items-center gap-2 p-4 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md transition-all"
          >
            <BarChart3 className="h-5 w-5" />
            <div className="text-center">
              <div className="font-medium">Ringkasan</div>
              <div className="text-xs text-muted-foreground">Dashboard & Statistik</div>
            </div>
          </TabsTrigger>
          <TabsTrigger 
            value="indicators" 
            className="flex flex-col items-center gap-2 p-4 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md transition-all"
          >
            <Settings className="h-5 w-5" />
            <div className="text-center">
              <div className="font-medium">Atur Indikator</div>
              <div className="text-xs text-muted-foreground">Tambah & Kelola</div>
            </div>
          </TabsTrigger>
          <TabsTrigger 
            value="data" 
            className="flex flex-col items-center gap-2 p-4 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md transition-all"
          >
            <Database className="h-5 w-5" />
            <div className="text-center">
              <div className="font-medium">Input Data</div>
              <div className="text-xs text-muted-foreground">Entri & Verifikasi</div>
            </div>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <Card className="border-0 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100">
              <CardTitle className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <BarChart3 className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <div>Dashboard Statistik</div>
                  <CardDescription className="mt-1">
                    Pantau kinerja dan perkembangan data {getCategoryDisplayName(category)} secara real-time
                  </CardDescription>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <DataManagementStats category={category} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="indicators" className="space-y-6">
          <IndicatorManagement category={category} onSessionUpdate={onSessionUpdate} />
        </TabsContent>

        <TabsContent value="data" className="space-y-6">
          <IndicatorDataManagement category={category} onSessionUpdate={onSessionUpdate} />
        </TabsContent>
      </Tabs>


    </div>
  );
}