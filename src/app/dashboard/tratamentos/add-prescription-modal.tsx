'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRouter } from 'next/navigation'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
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

interface Animal {
  id: string
  name: string
}

interface Medication {
  id: number
  name: string
}

interface AddPrescriptionModalProps {
  isOpen: boolean
  onClose: () => void
  animals: Animal[]
  medications: Medication[]
  administrationRoutes: string[]
}

const prescriptionSchema = z.object({
  animal_id: z.string().min(1, 'Selecione um animal'),
  medication_id: z.number({ required_error: 'Selecione um medicamento' }),
  dosage: z.string().min(1, 'Dosagem é obrigatória'),
  route: z.string().min(1, 'Via de administração é obrigatória'),
  interval_hours: z.number({ required_error: 'Frequência é obrigatória' }).int().positive(),
  start_date: z.string().min(1, 'Data de início é obrigatória'),
  start_time: z.string().optional(),
  duration_days: z.number().int().positive().optional().nullable(),
  is_continuous: z.boolean().default(false),
  description: z.string().optional(),
})

type PrescriptionFormData = z.infer<typeof prescriptionSchema>

export function AddPrescriptionModal({
  isOpen,
  onClose,
  animals,
  medications,
  administrationRoutes,
}: AddPrescriptionModalProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<PrescriptionFormData>({
    resolver: zodResolver(prescriptionSchema),
    defaultValues: {
      is_continuous: false,
    },
  })

  const isContinuous = watch('is_continuous')

  const onSubmit = async (data: PrescriptionFormData) => {
    setIsSubmitting(true)

    try {
      const response = await fetch('/api/prescriptions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          duration_days: data.is_continuous ? null : data.duration_days,
        }),
      })

      if (!response.ok) {
        throw new Error('Erro ao criar prescrição')
      }

      reset()
      onClose()
      router.refresh()
    } catch (error) {
      console.error('Erro ao criar prescrição:', error)
      alert('Erro ao criar prescrição. Por favor, tente novamente.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nova Prescrição</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="animal_id">Animal *</Label>
            <Select
              value={watch('animal_id')}
              onValueChange={(value) => setValue('animal_id', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o animal" />
              </SelectTrigger>
              <SelectContent>
                {animals.map((animal) => (
                  <SelectItem key={animal.id} value={animal.id}>
                    {animal.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.animal_id && (
              <p className="text-red-500 text-sm mt-1">{errors.animal_id.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="medication_id">Medicamento *</Label>
            <Select
              value={watch('medication_id')?.toString()}
              onValueChange={(value) => setValue('medication_id', Number(value))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o medicamento" />
              </SelectTrigger>
              <SelectContent>
                {medications.map((medication) => (
                  <SelectItem key={medication.id} value={medication.id.toString()}>
                    {medication.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.medication_id && (
              <p className="text-red-500 text-sm mt-1">{errors.medication_id.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="dosage">Dosagem *</Label>
            <Input
              id="dosage"
              {...register('dosage')}
              placeholder="Ex: 500mg, 2 comprimidos, 5ml"
            />
            {errors.dosage && (
              <p className="text-red-500 text-sm mt-1">{errors.dosage.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="route">Via de Administração *</Label>
            <Select
              value={watch('route')}
              onValueChange={(value) => setValue('route', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {administrationRoutes.map((route) => (
                  <SelectItem key={route} value={route}>
                    {route}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.route && (
              <p className="text-red-500 text-sm mt-1">{errors.route.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="interval_hours">Frequência (em horas) *</Label>
            <Input
              id="interval_hours"
              type="number"
              {...register('interval_hours', { valueAsNumber: true })}
              placeholder="Ex: 8 (para a cada 8 horas)"
            />
            {errors.interval_hours && (
              <p className="text-red-500 text-sm mt-1">{errors.interval_hours.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="start_date">Data de Início *</Label>
              <Input
                id="start_date"
                type="date"
                {...register('start_date')}
              />
              {errors.start_date && (
                <p className="text-red-500 text-sm mt-1">{errors.start_date.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="start_time">Horário de Início</Label>
              <Input
                id="start_time"
                type="time"
                {...register('start_time')}
              />
            </div>
          </div>

          {!isContinuous && (
            <div>
              <Label htmlFor="duration_days">Duração (dias)</Label>
              <Input
                id="duration_days"
                type="number"
                {...register('duration_days', { valueAsNumber: true })}
                placeholder="Ex: 7"
              />
              {errors.duration_days && (
                <p className="text-red-500 text-sm mt-1">{errors.duration_days.message}</p>
              )}
            </div>
          )}

          <div className="flex items-center space-x-2">
            <Checkbox
              id="is_continuous"
              checked={isContinuous}
              onCheckedChange={(checked) => setValue('is_continuous', checked as boolean)}
            />
            <Label htmlFor="is_continuous" className="cursor-pointer">
              Tratamento contínuo (sem data de término)
            </Label>
          </div>

          <div>
            <Label htmlFor="description">Observações</Label>
            <Textarea
              id="description"
              {...register('description')}
              placeholder="Informações adicionais sobre o tratamento"
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Salvando...' : 'Salvar Prescrição'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
