import { type Order, type OrderAction, type OrderBasketItem } from '@openmrs/esm-patient-common-lib';
import {
  isCoded,
  isPanel,
  type LabOrderConcept,
  type createObservationPayload,
} from '../lab-results/lab-results.resource';

/**
 * Enables a comparison of arbitrary values with support for undefined/null.
 * Requires the `<` and `>` operators to return something reasonable for the provided values.
 */
export function compare<T>(x?: T, y?: T) {
  if (x == undefined && y == undefined) {
    return 0;
  } else if (x == undefined) {
    return -1;
  } else if (y == undefined) {
    return 1;
  } else if (x < y) {
    return -1;
  } else if (x > y) {
    return 1;
  } else {
    return 0;
  }
}

/**
 * Builds medication order object from the given order object
 */
export function buildMedicationOrder(order: Order, action?: OrderAction) {
  return {
    display: order.drug?.display,
    previousOrder: action !== 'NEW' ? order.uuid : null,
    action: action,
    drug: order.drug,
    dosage: order.dose,
    unit: {
      value: order.doseUnits?.display,
      valueCoded: order.doseUnits?.uuid,
    },
    frequency: {
      valueCoded: order.frequency?.uuid,
      value: order.frequency?.display,
    },
    route: {
      valueCoded: order.route?.uuid,
      value: order.route?.display,
    },
    commonMedicationName: order.drug?.display,
    isFreeTextDosage: order.dosingType === 'org.openmrs.FreeTextDosingInstructions',
    freeTextDosage: order.dosingType === 'org.openmrs.FreeTextDosingInstructions' ? order.dosingInstructions : '',
    patientInstructions: order.dosingType !== 'org.openmrs.FreeTextDosingInstructions' ? order.dosingInstructions : '',
    asNeeded: order.asNeeded,
    asNeededCondition: order.asNeededCondition,
    startDate: action === 'DISCONTINUE' ? order.dateActivated : new Date(),
    duration: order.duration,
    durationUnit: {
      valueCoded: order.durationUnits?.uuid,
      value: order.durationUnits?.display,
    },
    pillsDispensed: order.quantity,
    numRefills: order.numRefills,
    indication: order.orderReasonNonCoded,
    orderer: order.orderer.uuid,
    careSetting: order.careSetting.uuid,
    quantityUnits: {
      value: order.quantityUnits?.display,
      valueCoded: order.quantityUnits?.uuid,
    },
  };
}

/**
 * Builds lab order object from the given order object
 */
export function buildLabOrder(order: Order, action?: OrderAction) {
  return {
    action: action,
    display: order.display,
    previousOrder: action !== 'NEW' ? order.uuid : null,
    orderer: order.orderer.uuid,
    careSetting: order.careSetting.uuid,
    instructions: order.instructions,
    urgency: order.urgency,
    accessionNumber: order.accessionNumber,
    testType: {
      label: order.concept.display,
      conceptUuid: order.concept.uuid,
    },
    orderNumber: order.orderNumber,
    concept: order.concept,
    orderType: order.orderType.uuid,
    specimenSource: null,
    scheduledDate: order.scheduledDate ? new Date(order.scheduledDate) : null,
  };
}

/**
 * Builds general order object from the given order object
 */
export function buildGeneralOrder(order: Order, action?: OrderAction): OrderBasketItem {
  return {
    action: action,
    display: order.display,
    previousOrder: action !== 'NEW' ? order.uuid : null,
    orderer: order.orderer.uuid,
    careSetting: order.careSetting.uuid,
    instructions: order.instructions,
    urgency: order.urgency,
    accessionNumber: order.accessionNumber,
    concept: order.concept,
    orderNumber: order.orderNumber,
    orderType: order.orderType.uuid,
    scheduledDate: order.scheduledDate ? new Date(order.scheduledDate) : null,
  };
}

export function extractPhoneNumber(str: string, extractNumbersOnly: boolean = false) {
  const phone = str.match(/\{([^}]*)\}/);
  return {
    str: str.replace(/\{[^}]*\}/g, '').trim(),
    phone: extractNumbersOnly && phone[1] ? extractNumbers(phone[1]) : phone ? phone[1] : null,
  };
}
function extractNumbers(input: string): string {
  return input.replace(/\D/g, '');
}

export const bot_url = 'http://localhost:3000'; // Change to your NestJS backend URL

export interface LabResult {
  status: string;
  name: string;
  result: ReturnType<typeof createObservationPayload>['obs'];
  createdDate: string;
  updatedDate: string;
}

export interface PatientData {
  openmrsId: string;
  firstName: string;
  lastName?: string;
  phone: string;
  labResults: LabResult[];
}

export const integrateLabOrderWithTgBot = async (patientData: PatientData) => {
  try {
    const response = await fetch(`${bot_url}/patients`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(patientData),
    });

    if (!response.ok) {
      throw new Error(`Failed to send patient data: ${response.statusText}`);
    }
    return response;
  } catch (error) {
    console.error('Error sending patient data to 🤖 tgbot:', error);
  }
};

export const getIntegratedBotBody = ({
  order,
  concept,
  obsPayload,
}: {
  order: Order;
  concept: LabOrderConcept;
  obsPayload: ReturnType<typeof createObservationPayload>;
}) => ({
  firstName: order.patient.person.display.split(' ')[0],
  lastName: order.patient.person.display.split(' ')[1],
  openmrsId: order.patient.display.split(' ')[0],
  phone: extractPhoneNumber(order.instructions, true).phone,
  labResults: [
    {
      name: order.display,
      createdDate: new Date().toISOString(),
      updatedDate: new Date().toISOString(),
      status: extractPhoneNumber(order.instructions, true).str,
      result: obsPayload.obs.map((obsPayload) =>
        isCoded(concept)
          ? {
              ...obsPayload,
              value: String(concept.answers.find((answer) => answer.uuid === obsPayload.value.uuid)?.display),
              units: concept?.units,
              hiAbsolute: concept?.hiAbsolute,
              hiNormal: concept?.hiNormal,
              lowAbsolute: concept?.lowAbsolute,
              lowNormal: concept?.lowNormal,
            }
          : isPanel(concept)
          ? {
              ...obsPayload,
              groupMembers: obsPayload.groupMembers.map((member) => ({ ...member, value: String(member.value) })),
            }
          : {
              ...obsPayload,
              value: String(obsPayload.value),
              units: concept?.units,
              hiAbsolute: concept?.hiAbsolute,
              hiNormal: concept?.hiNormal,
              lowAbsolute: concept?.lowAbsolute,
              lowNormal: concept?.lowNormal,
            },
      ),
    },
  ],
});
