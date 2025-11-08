'use client'

import { useState, useCallback } from 'react'
import { isValidEmail, isValidPassword, getPasswordStrength } from './utils'

interface ValidationRules {
  email?: boolean
  password?: boolean
  confirmPassword?: string
  required?: boolean
}

interface FormField {
  value: string
  error: string | null
  touched: boolean
}

interface FormState {
  [key: string]: FormField
}

export function useFormValidation(initialState: Record<string, string>) {
  const [formState, setFormState] = useState<FormState>(() => {
    const state: FormState = {}
    Object.keys(initialState).forEach(key => {
      state[key] = {
        value: initialState[key],
        error: null,
        touched: false
      }
    })
    return state
  })

  const setValue = useCallback((field: string, value: string) => {
    setFormState(prev => ({
      ...prev,
      [field]: {
        ...prev[field],
        value,
        touched: true
      }
    }))
  }, [])

  const setError = useCallback((field: string, error: string | null) => {
    setFormState(prev => ({
      ...prev,
      [field]: {
        ...prev[field],
        error
      }
    }))
  }, [])

  const validateField = useCallback((field: string, rules: ValidationRules) => {
    const fieldState = formState[field]
    if (!fieldState) return

    let error: string | null = null

    // Required validation
    if (rules.required && !fieldState.value.trim()) {
      error = 'This field is required'
    }
    // Email validation
    else if (rules.email && fieldState.value && !isValidEmail(fieldState.value)) {
      error = 'Please enter a valid email address'
    }
    // Password validation
    else if (rules.password && fieldState.value && !isValidPassword(fieldState.value)) {
      error = 'Password must be at least 6 characters long'
    }
    // Confirm password validation
    else if (rules.confirmPassword && fieldState.value !== formState[rules.confirmPassword]?.value) {
      error = 'Passwords do not match'
    }

    setError(field, error)
    return error === null
  }, [formState, setError])

  const validateForm = useCallback((validationRules: Record<string, ValidationRules>) => {
    let isValid = true
    
    Object.keys(validationRules).forEach(field => {
      const fieldValid = validateField(field, validationRules[field])
      if (!fieldValid) {
        isValid = false
      }
    })

    return isValid
  }, [validateField])

  const resetForm = useCallback(() => {
    setFormState(prev => {
      const newState: FormState = {}
      Object.keys(prev).forEach(key => {
        newState[key] = {
          value: initialState[key] || '',
          error: null,
          touched: false
        }
      })
      return newState
    })
  }, [initialState])

  const getFieldProps = useCallback((field: string) => ({
    value: formState[field]?.value || '',
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => setValue(field, e.target.value),
    onBlur: () => {
      setFormState(prev => ({
        ...prev,
        [field]: {
          ...prev[field],
          touched: true
        }
      }))
    }
  }), [formState, setValue])

  return {
    formState,
    setValue,
    setError,
    validateField,
    validateForm,
    resetForm,
    getFieldProps
  }
}

export function usePasswordStrength(password: string) {
  const strength = getPasswordStrength(password)
  
  const getStrengthColor = () => {
    if (strength.score <= 2) return 'bg-red-500'
    if (strength.score <= 3) return 'bg-yellow-500'
    return 'bg-green-500'
  }

  const getStrengthText = () => {
    if (strength.score <= 2) return 'Weak'
    if (strength.score <= 3) return 'Medium'
    return 'Strong'
  }

  return {
    ...strength,
    color: getStrengthColor(),
    text: getStrengthText()
  }
}