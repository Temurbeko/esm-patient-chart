import React, { useCallback, useEffect, useRef, useState } from 'react';
import Barcode from 'react-barcode';
import { useTranslation } from 'react-i18next';
import { useReactToPrint } from 'react-to-print';
import { Button, InlineLoading, ModalBody, ModalFooter, ModalHeader } from '@carbon/react';
import { getPatientName, showSnackbar, useConfig, getCoreTranslation } from '@openmrs/esm-framework';
import { type ConfigObject } from '../config-schema';
import { defaultBarcodeParams, getPatientField } from './print-identifier-sticker.resource';
import styles from './print-identifier-sticker.scss';

interface PrintIdentifierStickerProps {
  closeModal: () => void;
  patient: fhir.Patient;
}

interface PrintComponentProps extends Partial<ConfigObject> {
  patient: fhir.Patient;
}

const PrintIdentifierSticker: React.FC<PrintIdentifierStickerProps> = ({ closeModal, patient }) => {
  const { t } = useTranslation();
  const { printPatientSticker } = useConfig<ConfigObject>();
  const { pageSize, printScale = '1' } = printPatientSticker ?? {};
  const contentToPrintRef = useRef(null);
  const [isPrinting, setIsPrinting] = useState(false);
  const headerTitle = t('patientIdentifierSticker', 'Patient identifier sticker');

  const handleBeforeGetContent = useCallback(
    () =>
      new Promise<void>((resolve) => {
        if (patient && headerTitle) {
          setIsPrinting(true);
        }
      }),
    [headerTitle, patient],
  );

  const handleAfterPrint = useCallback(() => {
    setIsPrinting(false);
    closeModal();
  }, [closeModal]);

  const handlePrintError = useCallback((errorLocation, error) => {
    showSnackbar({
      isLowContrast: false,
      kind: 'error',
      title: getCoreTranslation('printError', 'Print error'),
      subtitle:
        getCoreTranslation('printErrorExplainer', 'An error occurred in "{{errorLocation}}": ', { errorLocation }) +
        error,
    });

    setIsPrinting(false);
  }, []);

  const handleInitiatePrint = useCallback(
    (printWindow: HTMLIFrameElement | null): Promise<void> => {
      return new Promise<void>((resolve) => {
        if (printWindow) {
          const printContent = printWindow.contentDocument || printWindow.contentWindow?.document;
          if (printContent) {
            printContent.documentElement.style.setProperty('--print-scale', printScale);
            printWindow.contentWindow?.print();
            resolve();
          }
        }
      });
    },
    [printScale],
  );

  const handlePrint = useReactToPrint({
    contentRef: contentToPrintRef,
    documentTitle: `${getPatientName(patient)} - ${headerTitle}`,
    onAfterPrint: handleAfterPrint,
    onBeforePrint: handleBeforeGetContent,
    onPrintError: handlePrintError,
    print: handleInitiatePrint,
  });

  return (
    <>
      <ModalHeader
        closeModal={closeModal}
        title={getCoreTranslation('printIdentifierSticker', 'Print identifier sticker')}
      />
      <ModalBody>
        <div ref={contentToPrintRef}>
          <style type="text/css" media="print">
            {`
              @page {
                size: ${pageSize};
              }
            `}
          </style>
          <PrintComponent patient={patient} />
        </div>
      </ModalBody>
      <ModalFooter>
        <Button kind="secondary" onClick={closeModal}>
          {getCoreTranslation('cancel', 'Cancel')}
        </Button>
        <Button
          className={styles.button}
          disabled={isPrinting}
          onClick={() => {
            setIsPrinting(true);
            setTimeout(() => {
              handlePrint();
            }, 1000);
          }}
          kind="primary"
        >
          {isPrinting ? (
            <InlineLoading className={styles.loader} description={getCoreTranslation('printing', 'Printing') + '...'} />
          ) : (
            getCoreTranslation('print', 'Print')
          )}
        </Button>
      </ModalFooter>
    </>
  );
};

const PrintComponent = ({ patient }: PrintComponentProps) => {
  const { printPatientSticker } = useConfig<ConfigObject>();
  const primaryIdentifierValue = patient?.identifier?.find((identifier) => identifier.use === 'official')?.value;
  return (
    <div className={styles.stickerContainer}>
      <div className={styles.documentHeader}>
        {printPatientSticker?.header?.showBarcode && (
          <Barcode value={primaryIdentifierValue} {...defaultBarcodeParams} />
        )}
        {printPatientSticker?.header?.showLogo && (
          <div className={styles.implementationLogo}>
            <ImplementationLogo />
          </div>
        )}
      </div>
      {printPatientSticker.fields.map((field) => {
        const Component = getPatientField(field);
        return <Component key={field} patient={patient} />;
      })}
    </div>
  );
};

const ImplementationLogo: React.FC = () => {
  const { t } = useTranslation();
  const { printPatientSticker } = useConfig<ConfigObject>();

  return printPatientSticker?.header?.logo ? (
    <img alt={t('implementationLogo', 'Implementation logo')} src={printPatientSticker?.header?.logo} />
  ) : (
    // TODO: Figure out why #omrs-logo-full-mono sprite is not working
    <svg data-testid="openmrs-logo" role="img" viewBox="0 0 380 119" xmlns="http://www.w3.org/2000/svg"></svg>
  );
};

export default PrintIdentifierSticker;
