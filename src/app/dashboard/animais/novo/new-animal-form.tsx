'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Progress } from '@/components/ui/progress'

interface Catalog {
  id: number
  name: string
  category: string
}

interface NewAnimalFormProps {
  species: Catalog[]
  sexes: Catalog[]
  statuses: Catalog[]
  colors: Catalog[]
  furTypes: Catalog[]
}

// Schema de validação
const animalSchema = z.object({
  // Etapa 1: Dados básicos
  name: z.string().min(1, 'Nome é obrigatório'),
  species_id: z.number({ required_error: 'Espécie é obrigatória' }),
  breed_id: z.number().optional().nullable(),
  sex_id: z.number().optional().nullable(),
  size: z.enum(['Pequeno', 'Médio', 'Grande']).optional().nullable(),
  birth_date: z.string().optional().nullable(),
  description: z.string().optional().nullable(),

  // Etapa 2: Saúde
  microchip_id: z.string().optional().nullable(),
  castrated: z.boolean().optional().nullable(),
  is_available_for_adoption: z.boolean().optional(),
  vaccines: z.string().optional(),
  allergies: z.string().optional(),
  medications: z.string().optional(),
  conditions: z.string().optional(),
  health_notes: z.string().optional(),

  // Etapa 3: Comportamento
  energy_level: z.enum(['Baixo', 'Médio', 'Alto']).optional().nullable(),
  sociability: z.enum(['Tímido', 'Moderado', 'Sociável']).optional().nullable(),
  good_with_kids: z.boolean().optional(),
  good_with_dogs: z.boolean().optional(),
  good_with_cats: z.boolean().optional(),
  house_trained: z.boolean().optional(),
  special_needs: z.string().optional(),
  behavior_notes: z.string().optional(),

  // Etapa 4: Aparência
  fur_type_id: z.number().optional().nullable(),
  color_ids: z.array(z.number()).optional(),
  markings: z.string().optional(),
  distinguishing_features: z.string().optional(),

  // Status
  status_id: z.number().optional().nullable(),
})

type AnimalFormData = z.infer<typeof animalSchema>

const STEPS = [
  { id: 1, title: 'Dados Básicos', description: 'Informações principais do animal' },
  { id: 2, title: 'Saúde', description: 'Condições de saúde e cuidados' },
  { id: 3, title: 'Comportamento', description: 'Personalidade e temperamento' },
  { id: 4, title: 'Aparência', description: 'Características físicas' },
]

export function NewAnimalForm({ species, sexes, statuses, colors, furTypes }: NewAnimalFormProps) {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [breeds, setBreeds] = useState<Catalog[]>([])
  const [selectedColors, setSelectedColors] = useState<number[]>([])

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<AnimalFormData>({
    resolver: zodResolver(animalSchema),
    defaultValues: {
      good_with_kids: false,
      good_with_dogs: false,
      good_with_cats: false,
      house_trained: false,
      castrated: false,
    },
  })

  const selectedSpeciesId = watch('species_id')

  // Buscar raças quando espécie for selecionada
  const handleSpeciesChange = async (speciesId: number) => {
    setValue('species_id', speciesId)
    setValue('breed_id', null)

    try {
      const response = await fetch(`/api/catalogs/breeds?parent_id=${speciesId}`)
      const data = await response.json()
      setBreeds(data.breeds || [])
    } catch (error) {
      console.error('Erro ao buscar raças:', error)
    }
  }

  const nextStep = () => {
    if (currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const onSubmit = async (data: AnimalFormData) => {
    setIsSubmitting(true)

    try {
      // Preparar dados de saúde
      const health_status = {
        vaccines: data.vaccines ? data.vaccines.split(',').map(v => v.trim()) : [],
        allergies: data.allergies ? data.allergies.split(',').map(a => a.trim()) : [],
        medications: data.medications ? data.medications.split(',').map(m => m.trim()) : [],
        conditions: data.conditions ? data.conditions.split(',').map(c => c.trim()) : [],
        notes: data.health_notes || '',
      }

      // Preparar dados de comportamento
      const behavior = {
        energy_level: data.energy_level,
        sociability: data.sociability,
        good_with_kids: data.good_with_kids,
        good_with_dogs: data.good_with_dogs,
        good_with_cats: data.good_with_cats,
        house_trained: data.house_trained,
        special_needs: data.special_needs || '',
        notes: data.behavior_notes || '',
      }

      const payload = {
        name: data.name,
        species_id: data.species_id,
        breed_id: data.breed_id,
        sex_id: data.sex_id,
        size: data.size,
        birth_date: data.birth_date,
        description: data.description,
        microchip_id: data.microchip_id,
        castrated: data.castrated,
        is_available_for_adoption: data.is_available_for_adoption,
        health_status,
        behavior,
        fur_type_id: data.fur_type_id,
        color_ids: selectedColors,
        markings: data.markings,
        distinguishing_features: data.distinguishing_features,
        status_id: data.status_id,
      }

      const response = await fetch('/api/animals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        throw new Error('Erro ao criar animal')
      }

      const result = await response.json()
      router.push(`/dashboard/animais/${result.animal.id}`)
    } catch (error) {
      console.error('Erro ao salvar animal:', error)
      alert('Erro ao salvar animal. Por favor, tente novamente.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const progress = (currentStep / STEPS.length) * 100

  return (
    <div className="max-w-3xl mx-auto">
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex justify-between mb-2">
          {STEPS.map((step) => (
            <div
              key={step.id}
              className={`flex-1 text-center ${
                step.id === currentStep ? 'font-semibold' : ''
              }`}
            >
              <div
                className={`inline-flex items-center justify-center w-8 h-8 rounded-full mb-2 ${
                  step.id === currentStep
                    ? 'bg-blue-600 text-white'
                    : step.id < currentStep
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-300 text-gray-600'
                }`}
              >
                {step.id}
              </div>
              <div className="text-xs">{step.title}</div>
            </div>
          ))}
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Etapa 1: Dados Básicos */}
        {currentStep === 1 && (
          <div className="bg-white p-6 rounded-lg shadow space-y-4">
            <h2 className="text-xl font-semibold mb-4">Dados Básicos</h2>

            <div>
              <Label htmlFor="name">Nome *</Label>
              <Input
                id="name"
                {...register('name')}
                placeholder="Ex: Rex, Mia, Bob"
              />
              {errors.name && (
                <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="species_id">Espécie *</Label>
              <Select
                value={selectedSpeciesId?.toString()}
                onValueChange={(value) => handleSpeciesChange(Number(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a espécie" />
                </SelectTrigger>
                <SelectContent>
                  {species.map((s) => (
                    <SelectItem key={s.id} value={s.id.toString()}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.species_id && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.species_id.message}
                </p>
              )}
            </div>

            {breeds.length > 0 && (
              <div>
                <Label htmlFor="breed_id">Raça</Label>
                <Select
                  value={watch('breed_id')?.toString() || ''}
                  onValueChange={(value) => setValue('breed_id', Number(value))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a raça" />
                  </SelectTrigger>
                  <SelectContent>
                    {breeds.map((b) => (
                      <SelectItem key={b.id} value={b.id.toString()}>
                        {b.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="sex_id">Sexo</Label>
                <Select
                  value={watch('sex_id')?.toString() || ''}
                  onValueChange={(value) =>
                    setValue('sex_id', value ? parseInt(value) : null)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {sexes.map((sex) => (
                      <SelectItem key={sex.id} value={sex.id.toString()}>
                        {sex.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="size">Tamanho</Label>
                <Select
                  value={watch('size') || ''}
                  onValueChange={(value) =>
                    setValue('size', value as 'Pequeno' | 'Médio' | 'Grande')
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Pequeno">Pequeno</SelectItem>
                    <SelectItem value="Médio">Médio</SelectItem>
                    <SelectItem value="Grande">Grande</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="birth_date">Data de Nascimento</Label>
              <Input id="birth_date" type="date" {...register('birth_date')} />
            </div>

            <div>
              <Label htmlFor="status_id">Status</Label>
              <Select
                value={watch('status_id')?.toString() || ''}
                onValueChange={(value) => setValue('status_id', Number(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o status" />
                </SelectTrigger>
                <SelectContent>
                  {statuses.map((s) => (
                    <SelectItem key={s.id} value={s.id.toString()}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="is_available_for_adoption"
                checked={watch('is_available_for_adoption') || false}
                onCheckedChange={(checked) => setValue('is_available_for_adoption', checked as boolean)}
              />
              <Label htmlFor="is_available_for_adoption" className="cursor-pointer">
                Disponível para adoção
              </Label>
            </div>

            <div>
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                {...register('description')}
                placeholder="Descreva o animal, sua história, etc."
                rows={4}
              />
            </div>
          </div>
        )}

        {/* Etapa 2: Saúde */}
        {currentStep === 2 && (
          <div className="bg-white p-6 rounded-lg shadow space-y-4">
            <h2 className="text-xl font-semibold mb-4">Saúde</h2>

            <div>
              <Label htmlFor="microchip_id">Microchip ID</Label>
              <Input
                id="microchip_id"
                {...register('microchip_id')}
                placeholder="Ex: 123456789012345"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="castrated"
                checked={watch('castrated') || false}
                onCheckedChange={(checked) => setValue('castrated', checked as boolean)}
              />
              <Label htmlFor="castrated" className="cursor-pointer">
                Castrado
              </Label>
            </div>

            <div>
              <Label htmlFor="vaccines">Vacinas (separadas por vírgula)</Label>
              <Input
                id="vaccines"
                {...register('vaccines')}
                placeholder="Ex: V8, V10, Antirrábica"
              />
            </div>

            <div>
              <Label htmlFor="allergies">Alergias (separadas por vírgula)</Label>
              <Input
                id="allergies"
                {...register('allergies')}
                placeholder="Ex: Frango, Glúten"
              />
            </div>

            <div>
              <Label htmlFor="medications">Medicamentos (separados por vírgula)</Label>
              <Input
                id="medications"
                {...register('medications')}
                placeholder="Ex: Antibiótico, Anti-inflamatório"
              />
            </div>

            <div>
              <Label htmlFor="conditions">Condições Médicas (separadas por vírgula)</Label>
              <Input
                id="conditions"
                {...register('conditions')}
                placeholder="Ex: Diabetes, Artrite"
              />
            </div>

            <div>
              <Label htmlFor="health_notes">Observações de Saúde</Label>
              <Textarea
                id="health_notes"
                {...register('health_notes')}
                placeholder="Observações adicionais sobre a saúde do animal"
                rows={3}
              />
            </div>
          </div>
        )}

        {/* Etapa 3: Comportamento */}
        {currentStep === 3 && (
          <div className="bg-white p-6 rounded-lg shadow space-y-4">
            <h2 className="text-xl font-semibold mb-4">Comportamento</h2>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="energy_level">Nível de Energia</Label>
                <Select
                  value={watch('energy_level') || ''}
                  onValueChange={(value) =>
                    setValue('energy_level', value as 'Baixo' | 'Médio' | 'Alto')
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Baixo">Baixo</SelectItem>
                    <SelectItem value="Médio">Médio</SelectItem>
                    <SelectItem value="Alto">Alto</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="sociability">Sociabilidade</Label>
                <Select
                  value={watch('sociability') || ''}
                  onValueChange={(value) =>
                    setValue('sociability', value as 'Tímido' | 'Moderado' | 'Sociável')
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Tímido">Tímido</SelectItem>
                    <SelectItem value="Moderado">Moderado</SelectItem>
                    <SelectItem value="Sociável">Sociável</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="good_with_kids"
                  checked={watch('good_with_kids') || false}
                  onCheckedChange={(checked) =>
                    setValue('good_with_kids', checked as boolean)
                  }
                />
                <Label htmlFor="good_with_kids" className="cursor-pointer">
                  Bom com crianças
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="good_with_dogs"
                  checked={watch('good_with_dogs') || false}
                  onCheckedChange={(checked) =>
                    setValue('good_with_dogs', checked as boolean)
                  }
                />
                <Label htmlFor="good_with_dogs" className="cursor-pointer">
                  Bom com cães
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="good_with_cats"
                  checked={watch('good_with_cats') || false}
                  onCheckedChange={(checked) =>
                    setValue('good_with_cats', checked as boolean)
                  }
                />
                <Label htmlFor="good_with_cats" className="cursor-pointer">
                  Bom com gatos
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="house_trained"
                  checked={watch('house_trained') || false}
                  onCheckedChange={(checked) =>
                    setValue('house_trained', checked as boolean)
                  }
                />
                <Label htmlFor="house_trained" className="cursor-pointer">
                  Treinado para casa
                </Label>
              </div>
            </div>

            <div>
              <Label htmlFor="special_needs">Necessidades Especiais</Label>
              <Input
                id="special_needs"
                {...register('special_needs')}
                placeholder="Ex: Precisa de exercício diário"
              />
            </div>

            <div>
              <Label htmlFor="behavior_notes">Observações de Comportamento</Label>
              <Textarea
                id="behavior_notes"
                {...register('behavior_notes')}
                placeholder="Observações adicionais sobre o comportamento"
                rows={3}
              />
            </div>
          </div>
        )}

        {/* Etapa 4: Aparência */}
        {currentStep === 4 && (
          <div className="bg-white p-6 rounded-lg shadow space-y-4">
            <h2 className="text-xl font-semibold mb-4">Aparência</h2>

            <div>
              <Label htmlFor="fur_type_id">Tipo de Pelagem</Label>
              <Select
                value={watch('fur_type_id')?.toString()}
                onValueChange={(value) => setValue('fur_type_id', Number(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo de pelagem" />
                </SelectTrigger>
                <SelectContent>
                  {furTypes.map((furType) => (
                    <SelectItem key={furType.id} value={furType.id.toString()}>
                      {furType.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Cores</Label>
              <div className="grid grid-cols-3 gap-2 mt-2 max-h-60 overflow-y-auto p-2 border rounded">
                {colors.map((color) => (
                  <div key={color.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`color-${color.id}`}
                      checked={selectedColors.includes(color.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedColors([...selectedColors, color.id])
                        } else {
                          setSelectedColors(selectedColors.filter((id) => id !== color.id))
                        }
                      }}
                    />
                    <label
                      htmlFor={`color-${color.id}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      {color.name}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <Label htmlFor="markings">Marcas</Label>
              <Input
                id="markings"
                {...register('markings')}
                placeholder="Ex: Mancha branca no peito"
              />
            </div>

            <div>
              <Label htmlFor="distinguishing_features">Características Distintivas</Label>
              <Textarea
                id="distinguishing_features"
                {...register('distinguishing_features')}
                placeholder="Ex: Cicatriz na pata traseira esquerda"
                rows={3}
              />
            </div>
          </div>
        )}

        {/* Botões de Navegação */}
        <div className="flex justify-between mt-6">
          <Button
            type="button"
            variant="outline"
            onClick={prevStep}
            disabled={currentStep === 1}
          >
            Anterior
          </Button>

          {currentStep < STEPS.length ? (
            <Button type="button" onClick={nextStep}>
              Próximo
            </Button>
          ) : (
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Salvando...' : 'Salvar Animal'}
            </Button>
          )}
        </div>
      </form>
    </div>
  )
}
