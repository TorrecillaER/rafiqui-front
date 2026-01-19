import type { ESGMetrics, AIStory } from '@/types';

export const esgMetrics: ESGMetrics = {
  co2Saved: 45200, // kg
  treesEquivalent: 2260,
  energySaved: 125000, // kWh
  waterSaved: 890000, // Litros
  panelsRecycled: 2547,
};

export const monthlyData = [
  { month: 'Ene', co2: 3200, panels: 180, energy: 8500 },
  { month: 'Feb', co2: 2800, panels: 156, energy: 7200 },
  { month: 'Mar', co2: 4100, panels: 230, energy: 11000 },
  { month: 'Abr', co2: 3600, panels: 201, energy: 9800 },
  { month: 'May', co2: 4500, panels: 252, energy: 12200 },
  { month: 'Jun', co2: 5200, panels: 291, energy: 14100 },
  { month: 'Jul', co2: 4800, panels: 268, energy: 13000 },
  { month: 'Ago', co2: 5100, panels: 285, energy: 13800 },
  { month: 'Sep', co2: 4200, panels: 235, energy: 11400 },
  { month: 'Oct', co2: 3900, panels: 218, energy: 10600 },
  { month: 'Nov', co2: 4400, panels: 246, energy: 11900 },
  { month: 'Dic', co2: 3400, panels: 190, energy: 9200 },
];

export const impactDistribution = [
  { name: 'Aluminio', value: 35, color: '#94A3B8' },
  { name: 'Vidrio', value: 40, color: '#22D3EE' },
  { name: 'Silicio', value: 15, color: '#A78BFA' },
  { name: 'Cobre', value: 10, color: '#F97316' },
];

export const aiStories: AIStory[] = [
  {
    id: 'story-001',
    title: 'El Viaje de 500 Paneles',
    content: `En una pequeña comunidad de Monterrey, 500 paneles solares que alguna vez iluminaron hogares encontraron un nuevo propósito. El aluminio recuperado se transformó en marcos de bicicletas para un programa de movilidad sustentable, mientras que el vidrio purificado ahora forma parte de una instalación artística en el Museo de Arte Contemporáneo.

Cada panel contaba una historia: 15 años de servicio, miles de horas de energía limpia, y ahora, una segunda vida que continúa el legado de sostenibilidad.`,
    generatedAt: new Date('2024-01-15'),
    panelOrigin: 'Monterrey, NL',
  },
  {
    id: 'story-002',
    title: 'De Techo Industrial a Obra de Arte',
    content: `Una fábrica en Querétaro decidió renovar su sistema solar después de 20 años. Los 1,200 paneles retirados parecían destinados al olvido, pero la artista Elena Vázquez vio en ellos una oportunidad única.

Hoy, "Reflejo Solar" - una escultura de 8 metros creada con células fotovoltaicas - se exhibe en el Parque Bicentenario, recordando a los visitantes que la sostenibilidad también puede ser hermosa.`,
    generatedAt: new Date('2024-02-20'),
    panelOrigin: 'Querétaro, QRO',
  },
  {
    id: 'story-003',
    title: 'Energía que Trasciende',
    content: `Los paneles de la escuela rural "Benito Juárez" en Oaxaca funcionaron durante 12 años, educando a más de 3,000 estudiantes. Cuando llegó el momento de reemplazarlos, la comunidad quiso que su legado continuara.

El silicio recuperado ahora alimenta nuevos paneles en otra escuela rural, mientras que los materiales restantes financiaron becas para estudiantes de ingeniería ambiental. Un ciclo de educación y sostenibilidad que no termina.`,
    generatedAt: new Date('2024-03-10'),
    panelOrigin: 'Oaxaca, OAX',
  },
];

export const partnerBenefits = [
  {
    title: 'Certificación ESG',
    description: 'Reportes verificados para tus informes de sostenibilidad corporativa.',
    icon: 'certificate',
  },
  {
    title: 'Trazabilidad Completa',
    description: 'Seguimiento blockchain de cada panel desde la recolección hasta el reciclaje.',
    icon: 'link',
  },
  {
    title: 'Impacto Medible',
    description: 'Métricas en tiempo real de tu contribución ambiental.',
    icon: 'chart',
  },
];
