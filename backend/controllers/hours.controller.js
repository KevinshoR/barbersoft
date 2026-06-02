    const HoursModel = require('../models/hours.model')

const HoursController = {
  async getAll(req, res) {
    try {
      const hours = await HoursModel.findAll(req.barbershop.id)
      res.json({ hours })
    } catch (err) {
      console.error(err)
      res.status(500).json({ error: 'Error obteniendo horarios' })
    }
  },

  async update(req, res) {
    try {
      const { day_of_week } = req.params
      const { open_time, close_time, is_open } = req.body

      if (is_open && (!open_time || !close_time)) {
        return res.status(400).json({ error: 'Horario de apertura y cierre son obligatorios' })
      }

      if (is_open && open_time >= close_time) {
        return res.status(400).json({ error: 'La hora de apertura debe ser anterior al cierre' })
      }

      const hours = await HoursModel.update(
        req.barbershop.id,
        parseInt(day_of_week),
        { open_time, close_time, is_open }
      )

      if (!hours) return res.status(404).json({ error: 'Horario no encontrado' })
      res.json({ hours })
    } catch (err) {
      console.error(err)
      res.status(500).json({ error: 'Error actualizando horario' })
    }
  }
}

module.exports = HoursController