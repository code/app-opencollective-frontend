import React from 'react';
import PropTypes from 'prop-types';
import { FastField, Field } from 'formik';
import { pickBy } from 'lodash';
import { useIntl } from 'react-intl';
import { ZodEffects, ZodObject } from 'zod';

import { isOCError } from '../lib/errors';
import { formatFormErrorMessage } from '../lib/form-utils';

import Container from './Container';
import StyledInput from './StyledInput';
import StyledInputField from './StyledInputField';
import { P } from './Text';

const isOptionalField = type => {
  return ['ZodOptional', 'ZodNullable'].includes(type._def.typeName);
};

const getTypeFromOptionalField = field => {
  if (isOptionalField(field)) {
    return getTypeFromOptionalField(field._def.innerType);
  } else {
    return field;
  }
};

const getStringOptionFromUnion = field => {
  for (const option of field._def.options) {
    const type = getTypeFromOptionalField(option);
    if (type._def.typeName === 'ZodString') {
      return type;
    }
  }
};

const getAttributesFromFormikZod = (form, name) => {
  if (!form.status || !(form.status instanceof ZodObject || form.status instanceof ZodEffects)) {
    return {};
  }

  let field = form.status.shape[name]; // TODO get from nested fields
  if (!field) {
    return {};
  }

  const attributes = { type: 'text', required: true };

  // Handle optional/required
  if (isOptionalField(field)) {
    attributes.required = false;
    field = field._def.innerType._def.innerType;
  } else if (field._def.typeName === 'ZodUnion') {
    // If any of the options is optional, the field is optional
    attributes.required = !field._def.options.some(option => isOptionalField(option));

    // It's common to have an union between a string and a literal(''), to allow empty strings while enforcing a minimum length.
    // In this case, we should use the string's attributes.
    const stringOption = getStringOptionFromUnion(field);
    if (stringOption) {
      field = stringOption;
    }
  }

  // Handle type-specific attributes
  if (field._def.typeName === 'ZodString') {
    if (field.minLength !== undefined) {
      attributes.minLength = field.minLength;
    }
    if (field.maxLength !== undefined) {
      attributes.maxLength = field.maxLength;
    }
  } else if (field._def.typeName === 'ZodNumber') {
    attributes.type = 'number';
    if (field.min !== undefined) {
      attributes.min = field.min;
    }
    if (field.max !== undefined) {
      attributes.max = field.max;
    }
  }

  return attributes;
};

/**
 * A special wrapper around `StyledInputField` + Formik's `Field` component.
 * Accept all props from `StyledInputField`.
 */
const StyledInputFormikField = ({
  name,
  children = null,
  validate = undefined,
  isFastField = false,
  flex = undefined,
  width = undefined,
  display = undefined,
  flexGrow = undefined,
  placeholder = undefined,
  ...props
}) => {
  const intl = useIntl();
  const FieldComponent = isFastField ? FastField : Field;
  const htmlFor = props.htmlFor || `input-${name}`;
  return (
    <FieldComponent name={name} validate={validate}>
      {({ field, form, meta }) => {
        const showError = Boolean(meta.error && (meta.touched || form.submitCount));
        const fieldAttributes = {
          ...getAttributesFromFormikZod(form, name),
          ...pickBy(
            {
              ...field,
              name: name || htmlFor,
              id: htmlFor,
              type: props.inputType,
              disabled: props.disabled,
              required: props.required,
              error: showError,
              placeholder,
            },
            value => value !== undefined,
          ),
        };

        return (
          <Container flex={flex} width={width} display={display} flexGrow={flexGrow}>
            <StyledInputField error={Boolean(meta.error)} {...props} name={name} htmlFor={htmlFor}>
              <React.Fragment>
                {children ? children({ form, meta, field: fieldAttributes }) : <StyledInput {...fieldAttributes} />}
                {showError && (
                  <P display="block" color="red.500" pt={2} fontSize="11px">
                    {isOCError(meta.error) ? formatFormErrorMessage(intl, meta.error) : meta.error}
                  </P>
                )}
              </React.Fragment>
            </StyledInputField>
          </Container>
        );
      }}
    </FieldComponent>
  );
};

StyledInputFormikField.propTypes = {
  name: PropTypes.string.isRequired,
  validate: PropTypes.func,
  isFastField: PropTypes.func,
  children: PropTypes.func,
  /** the label's 'for' attribute to be used as the 'name' and 'id' for the input */
  htmlFor: PropTypes.string,
  id: PropTypes.string,
  /** Passed to input as `type`. Adapts layout for checkboxes */
  inputType: PropTypes.string,
  placeholder: PropTypes.string,
  /** Show disabled state for field */
  disabled: PropTypes.bool,
  /** If set to false, the field will be marked as optional */
  required: PropTypes.bool,
  flex: PropTypes.any,
  display: PropTypes.any,
  width: PropTypes.any,
  flexGrow: PropTypes.any,
};

export default StyledInputFormikField;
