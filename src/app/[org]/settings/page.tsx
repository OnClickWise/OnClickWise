export default function SettingsPage({
  params,
}: {
  params: { org: string };
}) {
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold">Configurações</h1>
      <p className="mt-2 text-gray-600">
        Ajuste o branding e preferências da organização:{" "}
        <span className="font-mono bg-gray-100 px-2 py-1 rounded">
          {params.org}
        </span>
      </p>
    </div>
  );
}
