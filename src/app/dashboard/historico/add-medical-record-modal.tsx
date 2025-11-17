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

interface Animal {
  id: string
  name: string
}

interface Clinic {
  id: string
  name: string
}

interface AddMedicalRecordModalProps {
  isOpen: boolean
  onClose: () => void
  animals: Animal[]
  clinics: Clinic[]
  recordTypes: string[]
}

const medicalRecordSchema = z.object({
  animal_id: z.string().min(1, 'Selecione um animal'),
  record_type: z.string().min(1, 'Selecione o tipo de registro'),
  description: z.string().min(1, 'Descrição é obrigatória'),
  veterinarian: z.string().optional(),
  record_date: z.string().min(1, 'Data do registro é obrigatória'),
  next_due_date: z.string().optional(),
  clinic_id: z.string().optional(),
})

type MedicalRecordFormData = z.infer<typeof medicalRecordSchema>

export function AddMedicalRecordModal({
  isOpen,
  onClose,
  animals,
  clinics,
  recordTypes,
}: AddMedicalRecordModalProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<MedicalRecordFormData>({
    resolver: zodResolver(medicalRecordSchema),
  })

  const selectedRecordType = watch('record_type')

  const onSubmit = async (data: MedicalRecordFormData) => {
    setIsSubmitting(true)

    try {
      const response = await fetch('/api/medical-records', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          clinic_id: data.clinic_id || null,
          next_due_date: data.next_due_date || null,
        }),
      })

      if (!response.ok) {
        throw new Error('Erro ao criar registro médico')
      }

      reset()
      onClose()
      router.refresh()
    } catch (error) {
      console.error('Erro ao criar registro médico:', error)
      alert('Erro ao criar registro médico. Por favor, tente novamente.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Novo Registro Médico</DialogTitle>
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
            <Label htmlFor="record_type">Tipo de Registro *</Label>
            <Select
              value={selectedRecordType}
              onValueChange={(value) => setValue('record_type', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                {recordTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.record_type && (
              <p className="text-red-500 text-sm mt-1">{errors.record_type.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="description">Descrição *</Label>
            <Textarea
              id="description"
              {...register('description')}
              placeholder="Descreva o procedimento, diagnóstico ou observações"
              rows={4}
            />
            {errors.description && (
              <p className="text-red-500 text-sm mt-1">{errors.description.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="record_date">Data do Registro *</Label>
              <Input
                id="record_date"
                type="date"
                {...register('record_date')}
              />
              {errors.record_date && (
                <p className="text-red-500 text-sm mt-1">{errors.record_date.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="next_due_date">Próxima Data (opcional)</Label>
              <Input
                id="next_due_date"
                type="date"
                {...register('next_due_date')}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="veterinarian">Veterinário (opcional)</Label>
            <Input
              id="veterinarian"
              {...register('veterinarian')}
              placeholder="Nome do veterinário responsável"
            />
          </div>

          <div>
            <Label htmlFor="clinic_id">Clínica (opcional)</Label>
            <Select
              value={watch('clinic_id')}
              onValueChange={(value) => setValue('clinic_id', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione a clínica" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Nenhuma</SelectItem>
                {clinics.map((clinic) => (
                  <SelectItem key={clinic.id} value={clinic.id}>
                    {clinic.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
              {isSubmitting ? 'Salvando...' : 'Salvar Registro'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
