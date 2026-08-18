import type { Rule, Reward, Settings } from '../types'

export const defaultSettings = {
  child_name: 'Eli',
  week_start: 1,
  level1_min: 120,
  level1_max: 169,
  level2_min: 170,
  level2_max: 239,
  level3_min: 240,
  youtube_penalty: 50,
} satisfies Omit<Settings, 'id' | 'user_id'>

type RuleSeed = Omit<Rule, 'id' | 'user_id' | 'created_at'>

export const defaultRules: RuleSeed[] = [
  { name: 'Hacer las tareas del colegio', description: 'Terminar las tareas asignadas por el colegio.', points: 10, type: 'earning', active: true, frequency_label: 'Días de colegio', max_per_day: 1, max_per_week: null, school_days_only: true },
  { name: 'Completar actividades del colegio no terminadas', description: 'Terminar actividades pendientes de la jornada académica.', points: 8, type: 'earning', active: true, frequency_label: 'Cuando existan actividades pendientes', max_per_day: null, max_per_week: null, school_days_only: false },
  { name: 'Revisar Trendi y cuadernos', description: 'Revisar diariamente si hay tareas o pendientes.', points: 8, type: 'earning', active: true, frequency_label: 'Todos los días', max_per_day: 1, max_per_week: null, school_days_only: false },
  { name: 'Alistar cuadernos y materiales según el horario', description: 'Preparar los materiales según el horario del día siguiente.', points: 8, type: 'earning', active: true, frequency_label: 'Días de colegio', max_per_day: 1, max_per_week: null, school_days_only: true },
  { name: 'Tender la cama y ordenar el cuarto', description: 'Tender la cama y dejar el cuarto ordenado.', points: 4, type: 'earning', active: true, frequency_label: 'Todos los días', max_per_day: 1, max_per_week: null, school_days_only: false },
  { name: 'Recoger cuarto y baño', description: 'Recoger el desorden del cuarto y el baño.', points: 4, type: 'earning', active: true, frequency_label: 'Todos los días', max_per_day: 1, max_per_week: null, school_days_only: false },
  { name: 'Sacar y lavar la ropa interior de la ducha', description: 'Retirar y lavar la ropa interior después de bañarse.', points: 4, type: 'earning', active: true, frequency_label: 'Cada día que corresponda', max_per_day: 1, max_per_week: null, school_days_only: false },
  { name: 'Limpiar el baño', description: 'Dejar el baño limpio y ordenado.', points: 12, type: 'earning', active: true, frequency_label: 'Una vez por semana', max_per_day: null, max_per_week: 1, school_days_only: false },
  { name: 'Sacar la basura del baño', description: 'Vaciar la papelera del baño.', points: 4, type: 'earning', active: true, frequency_label: 'Dos veces por semana', max_per_day: null, max_per_week: 2, school_days_only: false },
  { name: 'Sacar la ropa sucia a lavar', description: 'Llevar la ropa sucia al lugar correspondiente.', points: 4, type: 'earning', active: true, frequency_label: 'Cualquier día', max_per_day: 1, max_per_week: null, school_days_only: false },
  { name: 'Guardar la ropa limpia', description: 'Guardar la ropa limpia en su lugar.', points: 4, type: 'earning', active: true, frequency_label: 'Cualquier día', max_per_day: 1, max_per_week: null, school_days_only: false },
  { name: 'Limpiar los zapatos del colegio', description: 'Limpiar los zapatos con anterioridad al día de uso.', points: 4, type: 'earning', active: true, frequency_label: 'Días de colegio', max_per_day: 1, max_per_week: null, school_days_only: true },
  { name: 'Cepillarse los dientes', description: 'Cepillarse los dientes 3 veces al día siguiendo la rutina de higiene y cuidado.', points: 6, type: 'earning', active: true, frequency_label: 'Todos los días', max_per_day: 3, max_per_week: null, school_days_only: false },

  { name: 'Usar YouTube', description: 'YouTube está prohibido independientemente del nivel. Regla crítica.', points: 50, type: 'penalty', active: true, frequency_label: 'Cualquier día', max_per_day: null, max_per_week: null, school_days_only: false },
  { name: 'Decir mentiras', description: 'Penalización muy alta por faltar a la verdad.', points: 40, type: 'penalty', active: true, frequency_label: 'Cualquier día', max_per_day: null, max_per_week: null, school_days_only: false },
  { name: 'Acumular ropa interior en la ducha 1 día o más', description: 'Penalización alta.', points: 30, type: 'penalty', active: true, frequency_label: 'Cualquier día', max_per_day: null, max_per_week: null, school_days_only: false },
  { name: 'Mala actitud o pataleta', description: 'Conducta irrespetuosa, gritos o pataleta.', points: 20, type: 'penalty', active: true, frequency_label: 'Cualquier día', max_per_day: null, max_per_week: null, school_days_only: false },
  { name: 'Guardar ropa sucia mezclada con ropa limpia', description: 'No separar correctamente la ropa sucia de la limpia.', points: 15, type: 'penalty', active: true, frequency_label: 'Cualquier día', max_per_day: null, max_per_week: null, school_days_only: false },
  { name: 'Tareas mal presentadas, sucias, tachadas o con letra poco legible', description: 'Trabajos escolares entregados sin cuidado.', points: 15, type: 'penalty', active: true, frequency_label: 'Cualquier día', max_per_day: null, max_per_week: null, school_days_only: false },
  { name: 'Tirar papeles o basura por fuera de los contenedores', description: 'No usar correctamente los contenedores de basura.', points: 10, type: 'penalty', active: true, frequency_label: 'Cualquier día', max_per_day: null, max_per_week: null, school_days_only: false },
]

export const defaultRewards: Omit<Reward, 'id' | 'user_id' | 'created_at'>[] = [
  // Nivel 1 · Cute
  { level: 1, name: 'Tablet', description: 'Uso de tablet para entretenimiento.', duration: 'Máximo 1 hora', frequency: 'Hasta 3 veces por semana', active: true },
  { level: 1, name: 'Juguetes', description: 'Tiempo libre de juego con juguetes.', duration: 'Máximo 1 hora', frequency: 'Hasta 3 veces por semana', active: true },
  { level: 1, name: 'Series o películas', description: 'Ver una serie o película en casa.', duration: 'Máximo 1 hora', frequency: 'Hasta 3 veces por semana', active: true },

  // Nivel 2 · Power (incluye todos los premios Cute)
  { level: 2, name: 'Tablet', description: 'Uso recreativo de tablet.', duration: 'Hasta 2 horas', frequency: 'Hasta 4 veces por semana', active: true },
  { level: 2, name: 'Series o películas', description: 'Contenido recreativo en casa.', duration: 'Hasta 2 horas', frequency: 'Hasta 4 veces por semana', active: true },
  { level: 2, name: 'Juguetes', description: 'Tiempo libre de juego.', duration: 'Hasta 2 horas', frequency: 'Hasta 4 veces por semana', active: true },
  { level: 2, name: 'Parque con bicicleta', description: 'Salida corta al parque con bicicleta.', duration: 'Hasta 2 horas', frequency: '1 vez por semana', active: true },
  { level: 2, name: 'Parque con scooter', description: 'Salida corta al parque con scooter.', duration: 'Hasta 2 horas', frequency: '1 vez por semana', active: true },
  { level: 2, name: 'Salida a algún lugar de la Sabana de Occidente (a elegir)', description: 'Únicamente sábado o domingo. Requiere que los deberes de la semana en curso estén realizados. Sujeta a decisión del adulto responsable.', duration: 'A definir', frequency: '1 vez', active: true },

  // Nivel 3 · Super Bunny (incluye todos los premios anteriores)
  { level: 3, name: 'Una salida a cine', description: 'Salida especial al cine.', duration: 'Película completa', frequency: '1 vez durante el fin de semana correspondiente', active: true },
  { level: 3, name: 'Salida a comer postre', description: 'Salida a comer un postre especial.', duration: 'Hasta 2 horas', frequency: '1 vez, fin de semana', active: true },
  { level: 3, name: 'Noche de película en familia', description: 'Noche especial de película en familia.', duration: '2–3 horas', frequency: '1 vez', active: true },
  { level: 3, name: 'Salida especial', description: 'Puede incluir parque de diversiones, Monserrate, museos, un sitio especial en Bogotá, un sitio especial del municipio, caminata ecológica u otra actividad especial elegida por el adulto. Aplican restricciones según distancia, tiempo, presupuesto, clima, seguridad y disponibilidad. No tiene que ocurrir obligatoriamente cada semana si las condiciones familiares no lo permiten, pero el nivel queda desbloqueado.', duration: 'Variable', frequency: '1 vez, según disponibilidad', active: true },
]
