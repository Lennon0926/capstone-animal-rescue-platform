"use client"

import * as React from "react"
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"
import {
  Card,
  CardContent,
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

type ChartPoint = {
  month: string
  dogs: number
  cats: number
}

type CustomTooltipEntry = {
  color?: string
  name?: string
  value?: number | string
}

type CustomTooltipProps = {
  active?: boolean
  payload?: CustomTooltipEntry[]
  label?: string
}

type AnimalRow = {
  species?: string
  created_at: string
}

function groupAnimalsByMonth(animals: AnimalRow[]): ChartPoint[] {
  const monthly: Record<string, { dogs: number; cats: number }> = {}

  for (const animal of animals) {
    const date = new Date(animal.created_at)
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
    if (!monthly[key]) monthly[key] = { dogs: 0, cats: 0 }

    const species = animal.species?.toLowerCase().trim()
    if (species === "dog" || species === "dogs" || species === "perro" || species === "perros") {
      monthly[key].dogs++
    } else if (species === "cat" || species === "cats" || species === "gato" || species === "gatos") {
      monthly[key].cats++
    }
  }

  return Object.entries(monthly)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, { dogs, cats }]) => ({ month, dogs, cats }))
}

function filterByTimeRange(data: ChartPoint[], timeRange: string): ChartPoint[] {
  if (data.length === 0) return []

  const monthsToShow = timeRange === "6m" ? 6 : timeRange === "3m" ? 3 : 12
  const latestMonthStr = data[data.length - 1]?.month
  if (!latestMonthStr) return []

  const [latestYear, latestMonth] = latestMonthStr.split("-").map(Number)
  const cursor = new Date(latestYear, latestMonth - 1, 1)

  const allMonths: Record<string, { dogs: number; cats: number }> = {}
  for (let i = 0; i < monthsToShow; i++) {
    const key = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}`
    allMonths[key] = { dogs: 0, cats: 0 }
    cursor.setMonth(cursor.getMonth() - 1)
  }

  for (const item of data) {
    if (allMonths[item.month]) {
      allMonths[item.month] = { dogs: item.dogs, cats: item.cats }
    }
  }

  return Object.entries(allMonths)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, { dogs, cats }]) => ({ month, dogs, cats }))
}

const chartConfig = {
  dogs: { label: "Perros", color: "var(--chart-dogs)" },
  cats: { label: "Gatos", color: "var(--chart-cats)" },
} satisfies ChartConfig

const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (!active || !payload?.length) return null

  const monthName = new Date(label + "-01").toLocaleDateString("es-ES", {
    month: "long",
    year: "numeric",
  })

  return (
    <div className={styles.customTooltip}>
      <p className={styles.tooltipLabel}>{monthName}</p>
      <div className={styles.tooltipContent}>
        {payload.map((entry, index) => (
          <div key={index} className={styles.tooltipItem}>
            <span className={styles.tooltipDot} style={{ backgroundColor: entry.color }} />
            <span className={styles.tooltipName}>{entry.name}:</span>
            <span className={styles.tooltipValue}>{entry.value} animales</span>
          </div>
        ))}
      </div>
    </div>
  )
}

type AnimalChartSectionProps = {
  title: string
  data: ChartPoint[]
  timeRange: string
  onTimeRangeChange: (value: string) => void
  isLoading: boolean
  emptyMessage: string
  gradientPrefix: string
}

const AnimalChartSection = ({
  title,
  data,
  timeRange,
  onTimeRangeChange,
  isLoading,
  emptyMessage,
  gradientPrefix,
}: AnimalChartSectionProps) => {
  const filteredData = filterByTimeRange(data, timeRange)
  const dogGradientId = `${gradientPrefix}Dogs`
  const catGradientId = `${gradientPrefix}Cats`

  return (
    <Card className={styles.card}>
      <CardHeader className={styles.cardHeader}>
        <div className={styles.cardHeaderContent}>
          <CardTitle className={styles.cardTitle}>{title}</CardTitle>
        </div>
        <Select value={timeRange} onValueChange={onTimeRangeChange}>
          <SelectTrigger className={styles.selectTrigger} aria-label="Select a value">
            <SelectValue placeholder="Últimos 12 meses" />
          </SelectTrigger>
          <SelectContent className={styles.selectContent}>
            <SelectItem value="12m" className={styles.selectItem}>Últimos 12 meses</SelectItem>
            <SelectItem value="6m" className={styles.selectItem}>Últimos 6 meses</SelectItem>
            <SelectItem value="3m" className={styles.selectItem}>Últimos 3 meses</SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent className={styles.cardContent}>
        <div className={styles.chartWrapper}>
          {isLoading ? (
            <div className={styles.loadingState}>Cargando datos del gráfico...</div>
          ) : filteredData.length === 0 ? (
            <div className={styles.emptyState}>{emptyMessage}</div>
          ) : (
            <ChartContainer config={chartConfig} className={styles.chartContainer}>
              <AreaChart data={filteredData}>
                <defs>
                  <linearGradient id={dogGradientId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--chart-dogs)" stopOpacity={0.6} />
                    <stop offset="95%" stopColor="var(--chart-dogs)" stopOpacity={0.05} />
                  </linearGradient>
                  <linearGradient id={catGradientId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--chart-cats)" stopOpacity={0.6} />
                    <stop offset="95%" stopColor="var(--chart-cats)" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#e0e0e0" />
                <XAxis
                  dataKey="month"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  tickFormatter={(value) => {
                    const formatted = new Date(value + "-01").toLocaleDateString("es-ES", {
                      month: "short",
                      year: "2-digit",
                    })
                    return formatted.charAt(0).toUpperCase() + formatted.slice(1)
                  }}
                />
                <YAxis tickLine={false} axisLine={false} />
                <ChartTooltip content={<CustomTooltip />} />
                <Area
                  dataKey="cats"
                  type="monotone"
                  fill={`url(#${catGradientId})`}
                  stroke="var(--chart-cats)"
                  strokeWidth={2.5}
                  dot={{ fill: "var(--chart-cats)", r: 4 }}
                  name="Gatos"
                />
                <Area
                  dataKey="dogs"
                  type="monotone"
                  fill={`url(#${dogGradientId})`}
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
  )
}

export default function AdminHome() {
  const [chartData, setChartData] = React.useState<ChartPoint[]>([])
  const [adoptedChartData, setAdoptedChartData] = React.useState<ChartPoint[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [timeRange, setTimeRange] = React.useState("3m")
  const [adoptedTimeRange, setAdoptedTimeRange] = React.useState("3m")

  React.useEffect(() => {
    const fetchAll = async () => {
      setIsLoading(true)
      try {
        const [activeResult, adoptedResult] = await Promise.all([
          supabase
            .from("animals")
            .select("species, created_at, status")
            .neq("status", "adoptado")
            .order("created_at", { ascending: true }),
          supabase
            .from("animals")
            .select("species, created_at, status")
            .eq("status", "adoptado")
            .order("created_at", { ascending: true }),
        ])

        if (activeResult.error) {
          console.error("Error fetching animals:", activeResult.error.message)
        } else {
          setChartData(groupAnimalsByMonth(activeResult.data ?? []))
        }

        if (adoptedResult.error) {
          console.error("Error fetching adopted animals:", adoptedResult.error.message)
        } else {
          setAdoptedChartData(groupAnimalsByMonth(adoptedResult.data ?? []))
        }
      } finally {
        setIsLoading(false)
      }
    }

    fetchAll()
  }, [])

  const totalAnimals = chartData.reduce((sum, item) => sum + item.dogs + item.cats, 0)
  const totalDogs = chartData.reduce((sum, item) => sum + item.dogs, 0)
  const totalCats = chartData.reduce((sum, item) => sum + item.cats, 0)

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

        <div className={styles.metricSection}>
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

          <AnimalChartSection
            title="Animales"
            data={chartData}
            timeRange={timeRange}
            onTimeRangeChange={setTimeRange}
            isLoading={isLoading}
            emptyMessage="No hay datos de animales disponibles"
            gradientPrefix="fill"
          />
        </div>

        <div className={styles.metricSection}>
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

          <AnimalChartSection
            title="Animales Adoptados"
            data={adoptedChartData}
            timeRange={adoptedTimeRange}
            onTimeRangeChange={setAdoptedTimeRange}
            isLoading={isLoading}
            emptyMessage="No hay datos de animales adoptados disponibles"
            gradientPrefix="fillAdopted"
          />
        </div>
      </div>
    </main>
  )
}
