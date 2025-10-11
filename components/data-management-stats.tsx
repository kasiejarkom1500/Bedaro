import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Activity, 
  BarChart3, 
  CheckCircle, 
  Clock, 
  Database, 
  FileText, 
  TrendingUp, 
  Users,
  Sparkles,
  Calendar,
  Target,
  Award
} from "lucide-react";
import { useDashboardStats } from "@/hooks/use-data-management";

interface DataManagementStatsProps {
  category?: string;
}

export function DataManagementStats({ category }: DataManagementStatsProps) {
  const userRole: "admin" | "superadmin" = 'admin'; // This should come from auth context
  const { stats, loading, error } = useDashboardStats(category);

  // Helper function to convert technical activity names to user-friendly descriptions
  const getActivityDisplayText = (action: string): string => {
    const activityMap: Record<string, string> = {
      'create_indicator': 'Menambah indikator baru',
      'update_indicator': 'Memperbarui indikator',
      'delete_indicator': 'Menghapus indikator',
      'create_indicator_data': 'Menambah data baru',
      'update_indicator_data': 'Memperbarui data',
      'delete_indicator_data': 'Menghapus data',
      'create_user': 'Menambah user baru',
      'update_user': 'Memperbarui user',
      'delete_user': 'Menghapus user',
      'verify_data': 'Memverifikasi data',
      'import_data': 'Mengimpor data dari Excel'
    };

    // Convert underscores to spaces and try to match
    const normalizedAction = action.toLowerCase().replace(/\s+/g, '_');
    
    return activityMap[normalizedAction] || 
           activityMap[action] || 
           action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  // Helper function to get activity icon based on action type
  const getActivityIcon = (action: string): string => {
    const iconMap: Record<string, string> = {
      'create_indicator': '➕',
      'update_indicator': '✏️',
      'delete_indicator': '🗑️',
      'create_indicator_data': '📊',
      'update_indicator_data': '📝',
      'delete_indicator_data': '❌',
      'create_user': '👤',
      'update_user': '🔧',
      'delete_user': '🚫',
      'verify_data': '✅',
      'import_data': '📥'
    };

    const normalizedAction = action.toLowerCase().replace(/\s+/g, '_');
    return iconMap[normalizedAction] || iconMap[action] || '📋';
  };

  // Filter activities to show only CRUD operations (exclude view actions)
  const getCrudActivities = (activities: any[]) => {
    const crudActions = [
      'create_indicator', 'update_indicator', 'delete_indicator',
      'create_indicator_data', 'update_indicator_data', 'delete_indicator_data',
      'create_user', 'update_user', 'delete_user',
      'verify_data', 'import_data'
    ];
    
    return activities.filter(activity => {
      const normalizedAction = activity.action?.toLowerCase().replace(/\s+/g, '_');
      return crudActions.includes(normalizedAction) || crudActions.includes(activity.action);
    });
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-4 rounded-full" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-3 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Default cards when no data */}
          <Card className="border-orange-200 bg-orange-50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-orange-800">Total Indikator</CardTitle>
              <BarChart3 className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-800">-</div>
              <p className="text-xs text-orange-600">
                Menunggu koneksi database
              </p>
            </CardContent>
          </Card>

          <Card className="border-blue-200 bg-blue-50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-800">Data Tersedia</CardTitle>
              <Database className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-800">-</div>
              <p className="text-xs text-blue-600">
                Memuat data...
              </p>
            </CardContent>
          </Card>

          <Card className="border-green-200 bg-green-50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-green-800">Data Terbaru</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-800">-</div>
              <p className="text-xs text-green-600">
                Siap untuk dikelola
              </p>
            </CardContent>
          </Card>

          <Card className="border-purple-200 bg-purple-50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-purple-800">Kategori</CardTitle>
              <FileText className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-800">
                {category?.includes('Demografi') ? 'Demografi' : 
                 category?.includes('Ekonomi') ? 'Ekonomi' : 
                 category?.includes('Lingkungan') ? 'Lingkungan' : 'Statistik'}
              </div>
              <p className="text-xs text-purple-600">
                {category || 'Kategori data statistik'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Welcome message */}
        <Card className="border-0 shadow-sm bg-gradient-to-r from-orange-50 to-orange-100">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-orange-200 rounded-full">
                <Sparkles className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800">
                  Selamat Datang di Dashboard {category?.includes('Demografi') ? 'Demografi & Sosial' : 
                                                category?.includes('Ekonomi') ? 'Ekonomi' : 
                                                category?.includes('Lingkungan') ? 'Lingkungan & Multi-Domain' : 'Statistik'}
                </h3>
                <p className="text-gray-600 mt-1">
                  Kelola data statistik, indikator, dan informasi untuk Kabupaten Bungo dengan mudah dan efisien.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {error && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 rounded-full">
                  <Clock className="h-4 w-4 text-red-600" />
                </div>
                <div>
                  <p className="text-sm text-red-800 font-medium">Koneksi Database</p>
                  <p className="text-xs text-red-600">
                    Pastikan MySQL di XAMPP sudah berjalan. Data akan dimuat otomatis setelah koneksi tersambung.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  const statCards = [
    {
      title: "Total Indikator",
      value: stats.indicators?.total || 0,
      description: `${stats.indicators?.active || 0} aktif • ${stats.indicators?.inactive || 0} non-aktif`,
      icon: FileText,
      gradient: "from-orange-50 to-orange-100",
      iconBg: "bg-orange-200",
      iconColor: "text-orange-600",
      textColor: "text-orange-900"
    },
    {
      title: "Data Tersimpan",
      value: stats.data?.total_data_points || 0,
      description: `Periode ${stats.data?.earliest_year || new Date().getFullYear()} - ${stats.data?.latest_year || new Date().getFullYear()}`,
      icon: Database,
      gradient: "from-amber-50 to-amber-100",
      iconBg: "bg-amber-200",
      iconColor: "text-amber-600",
      textColor: "text-amber-900"
    },
    {
      title: "Data Terverifikasi",
      value: stats.data?.verified || 0,
      description: stats.data?.total_data_points ? `${(((stats.data?.verified || 0) / stats.data.total_data_points) * 100).toFixed(1)}% dari total` : "0% dari total",
      icon: CheckCircle,
      gradient: "from-red-50 to-red-100",
      iconBg: "bg-red-200",
      iconColor: "text-red-600",
      textColor: "text-red-900"
    },
    {
      title: "Menunggu Review",
      value: stats.data?.draft || 0,
      description: stats.data?.total_data_points ? `${(((stats.data?.draft || 0) / stats.data.total_data_points) * 100).toFixed(1)}% dari total` : "0% dari total",
      icon: Clock,
      gradient: "from-yellow-50 to-yellow-100",
      iconBg: "bg-yellow-200",
      iconColor: "text-yellow-600",
      textColor: "text-yellow-900"
    }
  ];

  const statusBreakdown = [
    { 
      label: "📝 Draft", 
      count: stats.data?.draft || 0, 
      color: "bg-yellow-500",
      description: "Perlu ditinjau"
    },
    { 
      label: "🔄 Dalam Proses", 
      count: stats.data?.preliminary || 0, 
      color: "bg-orange-500",
      description: "Sedang diverifikasi"
    },
    { 
      label: "✅ Final", 
      count: stats.data?.final || 0, 
      color: "bg-red-500",
      description: "Sudah selesai"
    }
  ];

  return (
    <div className="space-y-6">
      {/* Main Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className={`bg-gradient-to-br ${stat.gradient} border-0 shadow-md hover:shadow-lg transition-all duration-200`}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className={`text-sm font-semibold ${stat.textColor}`}>{stat.title}</CardTitle>
                <div className={`p-2 rounded-lg ${stat.iconBg}`}>
                  <Icon className={`h-4 w-4 ${stat.iconColor}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${stat.textColor}`}>{(stat.value || 0).toLocaleString()}</div>
                <p className={`text-xs ${stat.textColor} opacity-80 mt-1`}>{stat.description}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Detailed Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Breakdown */}
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-800">
              <BarChart3 className="h-5 w-5 text-orange-600" />
              Status Data
            </CardTitle>
            <CardDescription>
              Distribusi status data berdasarkan tahap verifikasi
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {statusBreakdown.map((status) => (
              <div key={status.label} className="flex items-center justify-between p-3 rounded-lg bg-orange-50 hover:bg-orange-100 transition-colors">
                <div className="flex items-center gap-3">
                  <div className={`w-4 h-4 rounded-full ${status.color} shadow-sm`} />
                  <div>
                    <span className="text-sm font-semibold text-gray-800">{status.label}</span>
                    <p className="text-xs text-gray-600">{status.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-gray-800">{status.count}</span>
                  <Badge variant="secondary" className="text-xs bg-orange-100 text-orange-700">
                    {stats.data?.total_data_points ? ((status.count / stats.data.total_data_points) * 100).toFixed(1) : 0}%
                  </Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Recent Activities */}
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-800">
              <Activity className="h-5 w-5 text-orange-600" />
              Aktivitas Terkini
            </CardTitle>
            <CardDescription>
              Aktivitas CRUD (Create, Update, Delete) terbaru pada sistem
            </CardDescription>
          </CardHeader>
          <CardContent>
            {stats.recent_activities && stats.recent_activities.length > 0 ? (
              <div className="h-64 overflow-y-auto pr-2 custom-scrollbar">
                <div className="space-y-3">
                  {getCrudActivities(stats.recent_activities).slice(0, 20).map((activity, index) => (
                    <div key={activity.id || index} className="flex items-start gap-3 p-3 rounded-lg bg-orange-50 hover:bg-orange-100 transition-colors border border-orange-100">
                      <div className="flex-shrink-0 mt-1">
                        <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm border border-orange-200">
                          <span className="text-sm">{getActivityIcon(activity.action || 'system')}</span>
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-800 leading-relaxed">
                          {getActivityDisplayText(activity.action || 'Aktivitas sistem')}
                        </p>
                        {activity.target_name && (
                          <p className="text-xs text-gray-700 font-medium mt-1">
                            📋 {activity.target_name}
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-2">
                          <p className="text-xs text-gray-600">
                            oleh <span className="font-medium text-gray-700">{activity.user_name || 'Admin'}</span>
                          </p>
                          <span className="text-gray-400">•</span>
                          <p className="text-xs text-gray-500">
                            {activity.created_at ? new Date(activity.created_at).toLocaleDateString('id-ID', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            }) : 'Waktu tidak diketahui'}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {getCrudActivities(stats.recent_activities).length === 0 && (
                    <div className="text-center py-8">
                      <div className="p-4 bg-orange-100 rounded-full mx-auto w-fit mb-3">
                        <Activity className="h-6 w-6 text-orange-500" />
                      </div>
                      <p className="text-sm text-gray-600 font-medium">Belum ada aktivitas CRUD</p>
                      <p className="text-xs text-gray-500 mt-1">Aktivitas Create, Update, Delete akan muncul di sini</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="p-4 bg-orange-100 rounded-full mx-auto w-fit mb-3">
                  <Calendar className="h-6 w-6 text-orange-500" />
                </div>
                <p className="text-sm text-gray-600 font-medium">Belum ada aktivitas</p>
                <p className="text-xs text-gray-500 mt-1">Aktivitas Create, Update, Delete akan muncul setelah ada perubahan data</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Category Breakdown (for superadmin) */}
      {(userRole as string) === 'superadmin' && stats.category_breakdown && stats.category_breakdown.length > 0 && (
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-800">
              <TrendingUp className="h-5 w-5 text-orange-600" />
              Ringkasan per Kategori
            </CardTitle>
            <CardDescription>
              Distribusi indikator dan data per kategori administrasi
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              {stats.category_breakdown.map((breakdown, index) => (
                <div key={breakdown.category || index} className="flex items-center justify-between p-4 border rounded-lg bg-gradient-to-r from-orange-50 to-red-50 hover:shadow-md transition-all duration-200">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-800 text-lg">
                      {breakdown.category === 'demografi' && '👥 Demografi'}
                      {breakdown.category === 'ekonomi' && '💰 Ekonomi'}
                      {breakdown.category === 'lingkungan' && '🌿 Lingkungan'}
                      {!['demografi', 'ekonomi', 'lingkungan'].includes(breakdown.category) && `📈 ${breakdown.category}`}
                    </h4>
                    <div className="flex items-center gap-4 mt-2">
                      <p className="text-sm text-gray-600 bg-white px-3 py-1 rounded-full">
                        <span className="font-semibold">{breakdown.indicator_count}</span> indikator
                      </p>
                      <p className="text-sm text-gray-600 bg-white px-3 py-1 rounded-full">
                        <span className="font-semibold">{breakdown.data_count}</span> data tersimpan
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600 font-medium">
                      Terakhir diperbarui
                    </p>
                    <p className="text-sm font-semibold text-gray-800">
                      {breakdown.last_updated ? 
                        new Date(breakdown.last_updated).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        }) : 
                        'Belum ada data'
                      }
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}