"use client"

import * as React from "react"
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  type ChartConfig,
} from "@/components/ui/chart"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { supabase } from "@/lib/supabase"
import styles from "./adminHome.module.css"

// Custom Tooltip Component
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const monthName = new Date(label + "-01").toLocaleDateString("es-ES", {
      month: "long",
      year: "numeric",
    });

    return (
      <div className={styles.customTooltip}>
        <p className={styles.tooltipLabel}>{monthName}</p>
        <div className={styles.tooltipContent}>
          {payload.map((entry: any, index: number) => (
            <div key={index} className={styles.tooltipItem}>
              <span 
                className={styles.tooltipDot} 
                style={{ backgroundColor: entry.color }}
              />
              <span className={styles.tooltipName}>
                {entry.name}:
              </span>
              <span className={styles.tooltipValue}>{entry.value} animales</span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

const chartConfig = {
  dogs: {
    label: "Perros",
    color: "var(--chart-dogs)",
  },
  cats: {
    label: "Gatos",
    color: "var(--chart-cats)",
  },
} satisfies ChartConfig

export default function AdminHome() {
  const [chartData, setChartData] = React.useState<any[]>([])
  const [adoptedChartData, setAdoptedChartData] = React.useState<any[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [timeRange, setTimeRange] = React.useState("3m")
  const [adoptedTimeRange, setAdoptedTimeRange] = React.useState("3m")

  React.useEffect(() => {
    fetchAnimalData()
    fetchAdoptedAnimalData()
  }, [])

  const fetchAnimalData = async () => {
    try {
      setIsLoading(true)
      const { data, error } = await supabase
        .from("animals")
        .select("species, created_at, status")
        .neq("status", "adoptado")
        .order("created_at", { ascending: true })

      if (error) {
        console.error("Error fetching animals:", error.message)
        throw error
      }

      console.log("Fetched non-adopted animals:", data?.length)
      console.log("Sample animals:", data?.slice(0, 3))

      // Group animals by month
      const monthlyData: { [key: string]: { dogs: number; cats: number } } = {}

      data?.forEach((animal) => {
        const date = new Date(animal.created_at)
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
        
        if (!monthlyData[monthKey]) {
          monthlyData[monthKey] = { dogs: 0, cats: 0 }
        }

        const species = animal.species?.toLowerCase().trim()
        
        // Check for English and Spanish species names
        if (species === "dog" || species === "dogs" || species === "perro" || species === "perros") {
          monthlyData[monthKey].dogs++
        } else if (species === "cat" || species === "cats" || species === "gato" || species === "gatos") {
          monthlyData[monthKey].cats++
        } else {
          console.log("Unknown species:", species)
        }
      })

      // Convert to array and sort by month
      const formattedData = Object.entries(monthlyData)
        .sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
        .map(([month, { dogs, cats }]) => ({
          month,
          dogs,
          cats,
        }))

      setChartData(formattedData)
    } catch (error) {
      console.error("Error fetching animal data:", error)
      setChartData([])
    } finally {
      setIsLoading(false)
    }
  }

  const fetchAdoptedAnimalData = async () => {
    try {
      const { data, error } = await supabase
        .from("animals")
        .select("species, created_at, status")
        .eq("status", "adoptado")
        .order("created_at", { ascending: true })

      if (error) {
        console.error("Error fetching adopted animals:", error.message)
        throw error
      }

      // Group animals by month
      const monthlyData: { [key: string]: { dogs: number; cats: number } } = {}

      data?.forEach((animal) => {
        const date = new Date(animal.created_at)
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
        
        if (!monthlyData[monthKey]) {
          monthlyData[monthKey] = { dogs: 0, cats: 0 }
        }

        const species = animal.species?.toLowerCase().trim()
        
        if (species === "dog" || species === "dogs" || species === "perro" || species === "perros") {
          monthlyData[monthKey].dogs++
        } else if (species === "cat" || species === "cats" || species === "gato" || species === "gatos") {
          monthlyData[monthKey].cats++
        }
      })

      // Convert to array and sort by month
      const formattedData = Object.entries(monthlyData)
        .sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
        .map(([month, { dogs, cats }]) => ({
          month,
          dogs,
          cats,
        }))

      setAdoptedChartData(formattedData)
    } catch (error) {
      console.error("Error fetching adopted animal data:", error)
      setAdoptedChartData([])
    }
  }

  const getFilteredData = () => {
    if (chartData.length === 0) return []
    
    // Determine how many months to show
    let monthsToShow = 12
    if (timeRange === "6m") {
      monthsToShow = 6
    } else if (timeRange === "3m") {
      monthsToShow = 3
    }

    // Get the latest month from data
    const latestMonthStr = chartData[chartData.length - 1]?.month
    if (!latestMonthStr) return []

    const [latestYear, latestMonth] = latestMonthStr.split("-").map(Number)
    let currentDate = new Date(latestYear, latestMonth - 1, 1)

    // Generate all months in the range (going backwards)
    const allMonths: { [key: string]: { dogs: number; cats: number } } = {}
    
    for (let i = 0; i < monthsToShow; i++) {
      const year = currentDate.getFullYear()
      const month = String(currentDate.getMonth() + 1).padStart(2, "0")
      const monthKey = `${year}-${month}`
      allMonths[monthKey] = { dogs: 0, cats: 0 }
      currentDate.setMonth(currentDate.getMonth() - 1)
    }

    // Fill in actual data where available
    chartData.forEach((item) => {
      if (allMonths[item.month]) {
        allMonths[item.month] = { dogs: item.dogs, cats: item.cats }
      }
    })

    // Convert to array, sort, and return
    return Object.entries(allMonths)
      .sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
      .map(([month, { dogs, cats }]) => ({
        month,
        dogs,
        cats,
      }))
  }

  const getFilteredAdoptedData = () => {
    if (adoptedChartData.length === 0) return []
    
    // Determine how many months to show
    let monthsToShow = 12
    if (adoptedTimeRange === "6m") {
      monthsToShow = 6
    } else if (adoptedTimeRange === "3m") {
      monthsToShow = 3
    }

    // Get the latest month from data
    const latestMonthStr = adoptedChartData[adoptedChartData.length - 1]?.month
    if (!latestMonthStr) return []

    const [latestYear, latestMonth] = latestMonthStr.split("-").map(Number)
    let currentDate = new Date(latestYear, latestMonth - 1, 1)

    // Generate all months in the range (going backwards)
    const allMonths: { [key: string]: { dogs: number; cats: number } } = {}
    
    for (let i = 0; i < monthsToShow; i++) {
      const year = currentDate.getFullYear()
      const month = String(currentDate.getMonth() + 1).padStart(2, "0")
      const monthKey = `${year}-${month}`
      allMonths[monthKey] = { dogs: 0, cats: 0 }
      currentDate.setMonth(currentDate.getMonth() - 1)
    }

    // Fill in actual data where available
    adoptedChartData.forEach((item) => {
      if (allMonths[item.month]) {
        allMonths[item.month] = { dogs: item.dogs, cats: item.cats }
      }
    })

    // Convert to array, sort, and return
    return Object.entries(allMonths)
      .sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
      .map(([month, { dogs, cats }]) => ({
        month,
        dogs,
        cats,
      }))
  }

  const filteredData = getFilteredData()
  const adoptedFilteredData = getFilteredAdoptedData()

  // Calculate totals from all chart data (non-adopted)
  const totalAnimals = chartData.reduce((sum, item) => sum + item.dogs + item.cats, 0)
  const totalDogs = chartData.reduce((sum, item) => sum + item.dogs, 0)
  const totalCats = chartData.reduce((sum, item) => sum + item.cats, 0)

  // Calculate totals from adopted chart data
  const totalAdoptedAnimals = adoptedChartData.reduce((sum, item) => sum + item.dogs + item.cats, 0)
  const totalAdoptedDogs = adoptedChartData.reduce((sum, item) => sum + item.dogs, 0)
  const totalAdoptedCats = adoptedChartData.reduce((sum, item) => sum + item.cats, 0)

  return (
    <main>
      <div className={styles.container}>
        <div className={styles.header}>
          <div>
            <h1>Admin Dashboard</h1>
          </div>
        </div>

        {/* Stats Cards */}
        <div>
          <div className={styles.statsGrid}>
            <Card className={styles.statCard}>
              <CardContent className={styles.statCardContent}>
                <div className={styles.statLabel}>Total de Animales no adoptados</div>
                <div className={styles.statValue}>{totalAnimals}</div>
              </CardContent>
            </Card>

            <Card className={styles.statCard}>
              <CardContent className={styles.statCardContent}>
                <div className={styles.statLabel}>Total de Perros no adoptados</div>
                <div className={styles.statValue} style={{ color: "var(--chart-dogs)" }}>{totalDogs}</div>
              </CardContent>
            </Card>

            <Card className={styles.statCard}>
              <CardContent className={styles.statCardContent}>
                <div className={styles.statLabel}>Total de Gatos no adoptados</div>
                <div className={styles.statValue} style={{ color: "var(--chart-cats)" }}>{totalCats}</div>
              </CardContent>
            </Card>
          </div>

          <Card className={styles.card}>
          <CardHeader className={styles.cardHeader}>
            <div className={styles.cardHeaderContent}>
              <CardTitle className={styles.cardTitle}>Animales Creados por Mes</CardTitle>
            </div>
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger
                className={styles.selectTrigger}
                aria-label="Select a value"
              >
                <SelectValue placeholder="Últimos 12 meses" />
              </SelectTrigger>
              <SelectContent className={styles.selectContent}>
                <SelectItem value="12m" className={styles.selectItem}>
                  Últimos 12 meses
                </SelectItem>
                <SelectItem value="6m" className={styles.selectItem}>
                  Últimos 6 meses
                </SelectItem>
                <SelectItem value="3m" className={styles.selectItem}>
                  Últimos 3 meses
                </SelectItem>
              </SelectContent>
            </Select>
          </CardHeader>
          <CardContent className={styles.cardContent}>
            <div className={styles.chartWrapper}>
              {isLoading ? (
                <div className={styles.loadingState}>Cargando datos del gráfico...</div>
              ) : filteredData.length === 0 ? (
                <div className={styles.emptyState}>No hay datos de animales disponibles</div>
              ) : (
                <ChartContainer
                  config={chartConfig}
                  className={styles.chartContainer}
                >
                  <AreaChart data={filteredData}>
                    <defs>
                      <linearGradient id="fillDogs" x1="0" y1="0" x2="0" y2="1">
                        <stop
                          offset="5%"
                          stopColor="var(--chart-dogs)"
                          stopOpacity={0.6}
                        />
                        <stop
                          offset="95%"
                          stopColor="var(--chart-dogs)"
                          stopOpacity={0.05}
                        />
                      </linearGradient>
                      <linearGradient id="fillCats" x1="0" y1="0" x2="0" y2="1">
                        <stop
                          offset="5%"
                          stopColor="var(--chart-cats)"
                          stopOpacity={0.6}
                        />
                        <stop
                          offset="95%"
                          stopColor="var(--chart-cats)"
                          stopOpacity={0.05}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#e0e0e0" />
                    <XAxis
                      dataKey="month"
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                      tickFormatter={(value) => {
                        const date = new Date(value + "-01")
                        const formatted = date.toLocaleDateString("es-ES", {
                          month: "short",
                          year: "2-digit",
                        })
                        return formatted.charAt(0).toUpperCase() + formatted.slice(1)
                      }}
                    />
                    <YAxis 
                      tickLine={false}
                      axisLine={false}
                    />
                    <ChartTooltip content={<CustomTooltip />} />
                    <Area
                      dataKey="cats"
                      type="monotone"
                      fill="url(#fillCats)"
                      stroke="var(--chart-cats)"
                      strokeWidth={2.5}
                      dot={{ fill: "var(--chart-cats)", r: 4 }}
                      name="Gatos"
                    />
                    <Area
                      dataKey="dogs"
                      type="monotone"
                      fill="url(#fillDogs)"
                      stroke="var(--chart-dogs)"
                      strokeWidth={2.5}
                      dot={{ fill: "var(--chart-dogs)", r: 4 }}
                      name="Perros"
                    />
                    <ChartLegend content={<ChartLegendContent />} />
                  </AreaChart>
                </ChartContainer>
              )}
            </div>
          </CardContent>
        </Card>
        </div>

        {/* Adopted Animals Section */}
        <div className={styles.metricSection}>
          {/* Stats Cards for Adopted */}
          <div className={styles.statsGrid}>
          <Card className={styles.statCard}>
            <CardContent className={styles.statCardContent}>
              <div className={styles.statLabel}>Total de Animales Adoptados</div>
              <div className={styles.statValue}>{totalAdoptedAnimals}</div>
            </CardContent>
          </Card>

          <Card className={styles.statCard}>
            <CardContent className={styles.statCardContent}>
              <div className={styles.statLabel}>Total de Perros Adoptados</div>
              <div className={styles.statValue} style={{ color: "var(--chart-dogs)" }}>{totalAdoptedDogs}</div>
            </CardContent>
          </Card>

          <Card className={styles.statCard}>
            <CardContent className={styles.statCardContent}>
              <div className={styles.statLabel}>Total de Gatos Adoptados</div>
              <div className={styles.statValue} style={{ color: "var(--chart-cats)" }}>{totalAdoptedCats}</div>
            </CardContent>
          </Card>
        </div>

        <Card className={styles.card}>
          <CardHeader className={styles.cardHeader}>
            <div className={styles.cardHeaderContent}>
              <CardTitle className={styles.cardTitle}>Animales Adoptados por Mes</CardTitle>
            </div>
            <Select value={adoptedTimeRange} onValueChange={setAdoptedTimeRange}>
              <SelectTrigger
                className={styles.selectTrigger}
                aria-label="Select a value"
              >
                <SelectValue placeholder="Últimos 12 meses" />
              </SelectTrigger>
              <SelectContent className={styles.selectContent}>
                <SelectItem value="12m" className={styles.selectItem}>
                  Últimos 12 meses
                </SelectItem>
                <SelectItem value="6m" className={styles.selectItem}>
                  Últimos 6 meses
                </SelectItem>
                <SelectItem value="3m" className={styles.selectItem}>
                  Últimos 3 meses
                </SelectItem>
              </SelectContent>
            </Select>
          </CardHeader>
          <CardContent className={styles.cardContent}>
            <div className={styles.chartWrapper}>
              {isLoading ? (
                <div className={styles.loadingState}>Cargando datos del gráfico...</div>
              ) : adoptedFilteredData.length === 0 ? (
                <div className={styles.emptyState}>No hay datos de animales adoptados disponibles</div>
              ) : (
                <ChartContainer
                  config={chartConfig}
                  className={styles.chartContainer}
                >
                  <AreaChart data={adoptedFilteredData}>
                    <defs>
                      <linearGradient id="fillAdoptedDogs" x1="0" y1="0" x2="0" y2="1">
                        <stop
                          offset="5%"
                          stopColor="var(--chart-dogs)"
                          stopOpacity={0.6}
                        />
                        <stop
                          offset="95%"
                          stopColor="var(--chart-dogs)"
                          stopOpacity={0.05}
                        />
                      </linearGradient>
                      <linearGradient id="fillAdoptedCats" x1="0" y1="0" x2="0" y2="1">
                        <stop
                          offset="5%"
                          stopColor="var(--chart-cats)"
                          stopOpacity={0.6}
                        />
                        <stop
                          offset="95%"
                          stopColor="var(--chart-cats)"
                          stopOpacity={0.05}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#e0e0e0" />
                    <XAxis
                      dataKey="month"
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                      tickFormatter={(value) => {
                        const date = new Date(value + "-01")
                        const formatted = date.toLocaleDateString("es-ES", {
                          month: "short",
                          year: "2-digit",
                        })
                        return formatted.charAt(0).toUpperCase() + formatted.slice(1)
                      }}
                    />
                    <YAxis 
                      tickLine={false}
                      axisLine={false}
                    />
                    <ChartTooltip content={<CustomTooltip />} />
                    <Area
                      dataKey="cats"
                      type="monotone"
                      fill="url(#fillAdoptedCats)"
                      stroke="var(--chart-cats)"
                      strokeWidth={2.5}
                      dot={{ fill: "var(--chart-cats)", r: 4 }}
                      name="Gatos"
                    />
                    <Area
                      dataKey="dogs"
                      type="monotone"
                      fill="url(#fillAdoptedDogs)"
                      stroke="var(--chart-dogs)"
                      strokeWidth={2.5}
                      dot={{ fill: "var(--chart-dogs)", r: 4 }}
                      name="Perros"
                    />
                    <ChartLegend content={<ChartLegendContent />} />
                  </AreaChart>
                </ChartContainer>
              )}
            </div>
          </CardContent>
        </Card>
        </div>
      </div>
    </main>
  );
}