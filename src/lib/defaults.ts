import type { Rule, Reward, Settings } from '../types'

export const defaultSettings = {
  child_name: 'Eli',
  week_start: 1,
  level1_min: 50,
  level1_max: 79,
  level2_min: 80,
  level2_max: 120,
  level3_min: 121,
  youtube_penalty: 50,
} satisfies Omit<Settings, 'id' | 'user_id'>

export const defaultRules: Omit<Rule, 'id' | 'user_id' | 'created_at'>[] = [
  { name: 'Actividades del colegio', description: 'Terminar actividades escolares pendientes de la jornada.', points: 10, type: 'earning', active: true },
  { name: 'Revisar Trendi y cuadernos', description: 'Revisar diariamente si hay tareas o pendientes.', points: 10, type: 'earning', active: true },
  { name: 'Alistar cuadernos y materiales', description: 'Preparar materiales según el horario del día siguiente.', points: 10, type: 'earning', active: true },
  { name: 'Tender la cama y ordenar cuarto', description: 'Tender la cama y dejar el cuarto recogido.', points: 5, type: 'earning', active: true },
  { name: 'Recoger cuarto y baño', description: 'Recoger el desorden del cuarto y baño.', points: 5, type: 'earning', active: true },
  { name: 'Sacar y lavar ropa interior de la ducha', description: 'Retirar y lavar la ropa interior después de bañarse.', points: 5, type: 'earning', active: true },
  { name: 'Usar YouTube', description: 'Acceso a YouTube prohibido.', points: 50, type: 'penalty', active: true },
  { name: 'Mala actitud o pataleta', description: 'Conducta irrespetuosa, gritos o pataleta.', points: 20, type: 'penalty', active: true },
  { name: 'Incumplir tarea escolar', description: 'No realizar una tarea escolar que debía estar hecha.', points: 20, type: 'penalty', active: true },
  { name: 'Necesitar recordatorios continuos', description: 'Requerir varios recordatorios para cumplir un deber.', points: 10, type: 'penalty', active: true },
]

export const defaultRewards: Omit<Reward, 'id' | 'user_id' | 'created_at'>[] = [
  { level: 1, name: 'Tablet', description: 'Uso de tablet para entretenimiento.', duration: '1 hora', frequency: 'Hasta 3 veces por semana', active: true },
  { level: 1, name: 'Series o película', description: 'Ver una serie o película en casa.', duration: '1 hora', frequency: 'Hasta 3 veces por semana', active: true },
  { level: 1, name: 'Juguetes', description: 'Tiempo libre de juego con juguetes.', duration: '1 hora', frequency: 'Hasta 3 veces por semana', active: true },
  { level: 2, name: 'Tablet', description: 'Uso recreativo de tablet.', duration: '2 horas', frequency: 'Hasta 4 veces por semana', active: true },
  { level: 2, name: 'Series o película', description: 'Contenido recreativo en casa.', duration: '2 horas', frequency: 'Hasta 4 veces por semana', active: true },
  { level: 2, name: 'Juguetes', description: 'Tiempo libre de juego.', duration: '2 horas', frequency: 'Hasta 4 veces por semana', active: true },
  { level: 2, name: 'Parque con bicicleta', description: 'Salida corta al parque con bicicleta.', duration: 'Hasta 2 horas', frequency: '1 vez por semana', active: true },
  { level: 2, name: 'Parque con scooter', description: 'Salida corta al parque con scooter.', duration: 'Hasta 2 horas', frequency: '1 vez por semana', active: true },
  { level: 3, name: 'Cine', description: 'Salida especial al cine.', duration: 'Película completa', frequency: '1 vez por semana', active: true },
  { level: 3, name: 'Postre especial', description: 'Salida a comer un postre.', duration: 'Hasta 2 horas', frequency: '1 vez por semana', active: true },
  { level: 3, name: 'Noche de película familiar', description: 'Noche especial de película en familia.', duration: '2–3 horas', frequency: '1 vez por semana', active: true },
  { level: 3, name: 'Salida sorpresa especial', description: 'Parque de diversiones, caminata ecológica, Monserrate u otra montaña.', duration: 'Actividad completa', frequency: '1 vez por semana', active: true },
]