import React, { useRef, useState } from 'react';
import { PageHeader, IconBox } from '@/components/ui';
import { COLORS } from '@/utils/constants';
import { Toast } from 'primereact/toast';
import { FileUpload, FileUploadHandlerEvent } from 'primereact/fileupload';
import { uploadLeadsCSV } from './services';

export const LeadsPage: React.FC = () => {
  const toast = useRef<Toast>(null);
  const [loading, setLoading] = useState(false);
  const [uploadResult, setUploadResult] = useState<any>(null);

  const customUpload = async (event: FileUploadHandlerEvent) => {
    const file = event.files[0];
    if (!file) return;

    setLoading(true);
    setUploadResult(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const data = await uploadLeadsCSV(formData);
      setUploadResult(data);
      toast.current?.show({
        severity: 'success',
        summary: 'Éxito',
        detail: 'Archivo CSV subido correctamente',
        life: 3000,
      });
      event.options.clear();
    } catch (error: any) {
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: error.message || 'Error al subir el archivo',
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const emptyTemplate = () => {
    return (
      <div className="flex align-items-center flex-column justify-content-center h-full py-6" style={{ minHeight: '200px' }}>
        <i className="pi pi-cloud-upload mb-4" style={{ fontSize: '3.5rem', color: COLORS.gray300 }}></i>
        <span style={{ fontSize: '1.2rem', fontWeight: 600, color: COLORS.gray500, marginBottom: '8px' }}>
          Arrastra y suelta tu archivo CSV aquí
        </span>
        <span style={{ fontSize: '0.9rem', color: COLORS.gray400 }}>
          Solo se permiten archivos con extensión .csv
        </span>
      </div>
    );
  };

  return (
    <div style={{ padding: '0 10px' }}>
      <Toast ref={toast} />

      <PageHeader
        title="Importar Leads"
        subtitle="Sube tus archivos .csv para registrar leads de forma masiva en el sistema."
      />

      <div
        style={{
          background: COLORS.white,
          borderRadius: '24px',
          padding: '40px',
          border: `1px solid ${COLORS.gray100}`,
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.03)',
          marginBottom: '40px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '25px' }}>
          <IconBox icon="pi-file-excel" size="48px" iconSize="1.4rem" color={COLORS.red} bg={COLORS.redLight} />
          <div>
            <div style={{ fontWeight: 800, fontSize: '1.3rem', color: COLORS.black }}>Carga de Archivo</div>
            <div style={{ color: COLORS.gray400, fontSize: '0.9rem', marginTop: '4px' }}>
              Selecciona el archivo CSV con el formato requerido.
            </div>
          </div>
        </div>

        <div className="custom-fileupload-wrapper">
          <FileUpload
            name="file"
            accept=".csv"
            customUpload
            uploadHandler={customUpload}
            auto={false}
            maxFileSize={5000000}
            chooseLabel="Explorar Archivos"
            uploadLabel="Importar Datos"
            cancelLabel="Cancelar"
            disabled={loading}
            emptyTemplate={emptyTemplate}
            chooseOptions={{
              icon: 'pi pi-folder-open',
              className: 'p-button-outlined p-button-secondary',
              style: { borderRadius: '12px', fontWeight: 600 }
            }}
            uploadOptions={{
              icon: 'pi pi-cloud-upload',
              className: 'p-button-success',
              style: { borderRadius: '12px', fontWeight: 600, backgroundColor: COLORS.red, borderColor: COLORS.red }
            }}
            cancelOptions={{
              icon: 'pi pi-times',
              className: 'p-button-text p-button-danger',
              style: { borderRadius: '12px', fontWeight: 600 }
            }}
          />
        </div>

        {/* Global Styles para el fileUpload inside wrapper */}
        <style>
          {`
            .custom-fileupload-wrapper .p-fileupload {
              border: 2px dashed ${COLORS.gray200};
              border-radius: 20px;
              background-color: #fafafa;
              transition: all 0.2s ease-in-out;
            }
            .custom-fileupload-wrapper .p-fileupload:hover {
              border-color: ${COLORS.blue};
              background-color: #f1f5f9;
            }
            .custom-fileupload-wrapper .p-fileupload-buttonbar {
              background-color: transparent;
              border-bottom: 1px solid ${COLORS.gray200};
              padding: 1.5rem;
              border-top-left-radius: 20px;
              border-top-right-radius: 20px;
            }
            .custom-fileupload-wrapper .p-fileupload-content {
              border: none;
              padding: 2rem;
              background: transparent;
            }
            .custom-fileupload-wrapper .p-fileupload .p-button {
              padding: 0.75rem 1.25rem;
            }
          `}
        </style>

        {loading && (
          <div className="mt-5 flex align-items-center justify-content-center gap-3 p-4 border-round-xl border-1" style={{ borderColor: COLORS.gray200, backgroundColor: COLORS.white }}>
            <i className="pi pi-spin pi-spinner" style={{ fontSize: '1.8rem', color: COLORS.red }} />
            <span style={{ fontWeight: 600, color: COLORS.gray600, fontSize: '1.1rem' }}>Subiendo y procesando archivo. Por favor, espera...</span>
          </div>
        )}

        {uploadResult && (
          <div
            className="mt-5 border-round-xl"
            style={{
              backgroundColor: '#1e293b', /* Dark mode modern container */
              overflow: 'hidden',
              boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
            }}
          >
            <div className="flex align-items-center gap-2 p-3 border-bottom-1" style={{ borderColor: '#334155', backgroundColor: '#0f172a' }}>
              <i className="pi pi-check-circle text-green-400" style={{ fontSize: '1.2rem' }}></i>
              <span style={{ fontWeight: 700, color: '#f8fafc', fontSize: '1rem' }}>
                Reporte de Importación Generado
              </span>
            </div>
            <pre
              style={{
                color: '#38bdf8', /* Cool tailwind blue */
                padding: '1.5rem',
                margin: 0,
                overflowX: 'auto',
                fontSize: '0.9rem',
                lineHeight: '1.5',
                fontFamily: 'monospace'
              }}
            >
              {JSON.stringify(uploadResult, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};
