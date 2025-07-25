import React, { Fragment, useMemo, useRef } from 'react';
import type { Fixture } from '@ubilabs/react-geosuggest';
import Geosuggest from '@ubilabs/react-geosuggest';
import { get, isNil, omitBy, pick } from 'lodash';
import { X } from 'lucide-react';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';

import { cn } from '@/lib/utils';

import I18nAddressFields, { NewSimpleLocationFieldRenderer } from '@/components/I18nAddressFields';
import I18nFormatters from '@/components/I18nFormatters';

import InputCountry from '../InputCountry';
import MessageBox from '../MessageBox';

import { Button } from './Button';
import { BASE_INPUT_CLASS, Input } from './Input';
import { Label } from './Label';
import { Location } from './Location';
import { Textarea } from './Textarea';

const removeCountryFromAddress = address => address.split(', ').slice(0, -1).join(', ');

const messages = defineMessages({
  online: { id: 'Location.online', defaultMessage: 'Online' },
});

const LocationInput = ({ value, onChange, placeholder }) => {
  const intl = useIntl();
  const geoSuggestRef = useRef(undefined);
  const isAutocompleteServiceAvailable = useMemo(
    () => typeof window !== 'undefined' && Boolean(get(window, 'google.maps.places.AutocompleteService')),
    [],
  );

  const handleChange = value => {
    if (!value) {
      return onChange(null);
    } else if (value.isOnline) {
      return onChange({ name: 'Online', address: value.address });
    }

    const country = value.gmaps['address_components'].find(c => c.types.includes('country'))?.['short_name'];
    /* Use ADR microformat field `adr_address` because of more consistent formatting and since
       it also includes a single field for street address (with house number in the correct place depending on locality) */
    const adrAddress = value.gmaps['adr_address'];
    const parser = new DOMParser();
    const adrAddressDoc = parser.parseFromString(adrAddress, 'text/html');
    const structured = {
      address1: adrAddressDoc.querySelector('.street-address')?.textContent,
      address2: adrAddressDoc.querySelector('.extended-address')?.textContent,
      postalCode: adrAddressDoc.querySelector('.postal-code')?.textContent,
      city: adrAddressDoc.querySelector('.locality')?.textContent,
      zone: adrAddressDoc.querySelector('.region')?.textContent,
    };

    const location = {
      // Remove country from address
      address: removeCountryFromAddress(value.gmaps.formatted_address),
      // Keep only the first part for location name
      name: value.label && value.label.replace(/,.+/, ''),
      country,
      lat: value.location.lat,
      long: value.location.lng,
      structured: omitBy(structured, isNil),
    };

    return onChange(location);
  };

  return (
    <div className="flex flex-col gap-2">
      {!isAutocompleteServiceAvailable ? (
        <MessageBox withIcon type="warning">
          <FormattedMessage
            id="location.googleAutocompleteService.unavailable"
            values={{ service: 'Google Autocomplete Service', domain: 'maps.googleapis.com', lineBreak: <br /> }}
            defaultMessage={`Location field requires "{service}" to function.{lineBreak} Make sure "{domain}" is not blocked.`}
          />
        </MessageBox>
      ) : (
        <Fragment>
          <style>{`
            .geosuggest__suggests--hidden {
              display: none !important;
            }
            .geosuggest__suggests-wrapper {
              z-index: 2000;
            }
            .geosuggest__suggests {
              display: flex;
              flex-direction: column;
              margin-top: 1.25em;
              background-color: #FFF;
              border: 1px solid oklch(0.929 0.013 255.508);
              border-radius: 10px;
              margin-left: -1em;
              margin-right: -1em;
              overflow: hidden;
              box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);

            }
            .geosuggest__item {
              cursor: pointer;
              padding: 8px 12px;
              &:hover {
                background-color: oklch(96.8% 0.007 247.896);
              }
            }
          `}</style>
          <div className="flex items-center gap-2">
            <Geosuggest
              className={cn(BASE_INPUT_CLASS, 'flex flex-col [&_input]:w-full [&_input]:border-0 [&_input]:outline-0')}
              onSuggestSelect={event => handleChange(event)}
              placeholder={placeholder}
              initialValue={value?.name}
              fixtures={
                [
                  {
                    label: intl.formatMessage(messages.online),
                    location: { lat: 0, lng: 0 },
                    className: 'fixture',
                    isOnline: true,
                  },
                ] as unknown as Fixture[]
              }
              ref={geoSuggestRef}
            />
            {value !== null && (
              <Button
                variant="outline"
                size="icon"
                onClick={() => {
                  geoSuggestRef.current.clear();
                  handleChange(null);
                }}
              >
                <X size="18" />
              </Button>
            )}
          </div>

          {value?.name === 'Online' ? (
            <div className="mt-2">
              <Label>
                <FormattedMessage id="OnlineAddress" defaultMessage="Online address" />
              </Label>
              <Input
                width="100%"
                placeholder="https://meet.jit.si/opencollective"
                defaultValue={value.address}
                onChange={({ target: { value } }) => {
                  handleChange({ isOnline: true, address: value });
                }}
              />
            </div>
          ) : (
            <Location location={value} />
          )}
        </Fragment>
      )}
    </div>
  );
};

const DEFAULT_LOCATION = {
  country: null,
  address: null,
  structured: null,
};

/**
 * A component to input a location. It tries to use the structured address if available,
 * and fallbacks on the raw address if not.
 */
export const UserLocationInput = ({
  location,
  labelFontSize = undefined,
  labelFontWeight = undefined,
  onChange,
  errors = undefined,
  required = true,
  onLoadSuccess = undefined,
  useStructuredForFallback = false,
}) => {
  const [useFallback, setUseFallback] = React.useState(false);
  const forceLegacyFormat = Boolean(!location?.structured && location?.address);
  const hasCountry = Boolean(location?.country);
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <Label className="leading-normal">Country</Label>
        <InputCountry
          value={location?.country}
          onChange={country => onChange(pick({ ...(location || DEFAULT_LOCATION), country }, ['country']))}
        />
      </div>
      {hasCountry && !useFallback && !forceLegacyFormat ? (
        <I18nAddressFields
          selectedCountry={location?.country}
          value={location?.structured || {}}
          onLoadError={() => setUseFallback(true)} // TODO convert from structured to raw
          onLoadSuccess={onLoadSuccess}
          Component={NewSimpleLocationFieldRenderer}
          fieldProps={{ labelFontSize, labelFontWeight }}
          required={required}
          prefix=""
          errors={errors?.structured}
          onCountryChange={structured =>
            onChange(pick({ ...(location || DEFAULT_LOCATION), structured }, ['country', 'structured']))
          }
        />
      ) : useFallback ? (
        <MessageBox type="error" withIcon mt={2}>
          <FormattedMessage
            defaultMessage="Failed to load the structured address fields. Please reload the page or <SupportLink>contact support</SupportLink>."
            id="5A4zUi"
            values={I18nFormatters}
          />
        </MessageBox>
      ) : (
        <div className="flex flex-col gap-1">
          <Label className="leading-normal">
            <FormattedMessage id="collective.address.label" defaultMessage="Address" />
          </Label>
          <Textarea
            value={location?.address}
            onChange={e => {
              const address = e.target.value;
              if (!useStructuredForFallback) {
                onChange(pick({ ...(location || DEFAULT_LOCATION), address }, ['country', 'address']));
              } else {
                onChange(
                  pick({ ...(location || DEFAULT_LOCATION), structured: { address1: address } }, [
                    'country',
                    'structured',
                  ]),
                );
              }
            }}
          />
        </div>
      )}
    </div>
  );
};

export default LocationInput;
