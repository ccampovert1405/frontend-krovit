# 🏢 CRM - Viviendas y Vehículos

Sistema de Gestión de Relaciones con Clientes (CRM) para comercialización de planes de compra programada.

## ⚡ Tecnologías

- **React 18** con TypeScript
- **PrimeReact** - Framework UI
- **PrimeFlex** - Utilidades CSS
- **PrimeIcons** + **Lucide React** - Iconografía
- **Vite** - Build tool

## 🚀 Inicio Rápido

```bash
# Instalar dependencias
npm install

# Desarrollo
npm run dev

# Build producción
npm run build
```

## 📁 Estructura

```
src/
├── components/
│   ├── ui/           # Componentes reutilizables
│   ├── layout/       # Sidebar
│   ├── dashboard/    # Dashboard
│   ├── prospectos/   # Prospectos + Modal
│   └── pages/        # Otras páginas
├── hooks/            # Custom Hooks
├── types/            # TypeScript types
├── utils/            # Constantes
├── data/             # Datos de ejemplo
└── styles/           # CSS global
```

## 🎨 Paleta de Colores

| Color | Hex | Uso |
|-------|-----|-----|
| Rojo | #E31E24 | Primario |
| Negro | #1A1A1A | Textos |
| Verde | #10B981 | Éxito |
| Azul | #3B82F6 | Info |
| Amarillo | #F59E0B | Alerta |
| Morado | #8B5CF6 | Acento |

## 📦 Módulos

1. **Dashboard** - KPIs, filtros, embudo AIDA
2. **Prospectos** - Kanban AIDA, formulario nuevo prospecto
3. **Oportunidades** - Pipeline de ventas
4. **Tareas** - Gestión de tareas
5. **Actividades** - Calendario
6. **Planificación** - Agenda de actividades
7. **Forecast** - Proyecciones

## 🔧 Hooks Disponibles

```typescript
// Filtros globales
const { selectedMes, selectedAgente, resetFilters } = useFilters();

// Datos filtrados
const { prospectosFiltrados, oportunidadesFiltradas } = useFilteredData({ mes, agente });

// KPIs calculados
const { produccion, eficacia, contribucion } = useKPIs({ prospectos, oportunidades });

// Embudo AIDA
const aidaFunnel = useAIDAFunnel(prospectos);

// Gestión de prospectos
const { prospectos, modalVisible, addProspecto } = useProspectos();
```

## 📄 Licencia

Propietario - KRIVOT ECUADOR © 2026
