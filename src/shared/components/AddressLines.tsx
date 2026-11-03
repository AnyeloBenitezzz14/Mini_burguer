// A long address shown one part per line ("Calle 50 # 45-20" / "Barrio Santa Ana" / "Torre 2 apto 301")
const AddressLines = ({ address }: { address: string }) => (
  <>
    {address.split(/,\s*/).filter(Boolean).map((part, i) => (
      <span key={i} className="block">{part}</span>
    ))}
  </>
)

export default AddressLines
