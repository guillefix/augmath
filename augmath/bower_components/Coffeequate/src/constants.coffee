# A map of symbolic constant labels to values.
constants = {
	c: 299792458				# Relativistic constant
	G: 6.67384e-11				# Gravitational constant
	π: Math.PI					# Circle constant
	PI: Math.PI					# Circle constant
	E: Math.E					# Exponential constant
	e: Math.E					# Exponential constant
	ε0: 8.85418782e-12			# Electric constant
	μ0: 1.25663706e-6			# Magnetic constant
	k: 1.3806488e-23			# Boltzmann constant
	h: 6.62606957e-34			# Planck constant
	hbar: 1.05457173e-34		# Reduced Planck constant
	NA: 6.02214129e23			# Avogadro constant
	mu: 1.66053892e-27			# Atomic mass constant
	a0: 5.29e-11				# Bohr radius
	ke: 1/(4 * Math.PI * 8.85418782e-12) # Coulomb constant
	ec: 1.60217657e-19			# Elementary charge
	R: 8.3144621				# Universal gas constant
}

define ->
	return constants