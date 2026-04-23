"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Plane } from "lucide-react";

interface AgencyRequestFormProps {
  userId: string;
  userName: string;
  userEmail: string;
  userPhone?: string | null;
}

export function AgencyRequestForm({ userId, userName, userEmail, userPhone }: AgencyRequestFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);

  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [travelDate, setTravelDate] = useState("");
  const [returnDate, setReturnDate] = useState("");
  const [passengers, setPassengers] = useState("1");
  const [cabinClass, setCabinClass] = useState("economy");
  const [flexibleDates, setFlexibleDates] = useState(false);
  const [notes, setNotes] = useState("");
  const [contactName, setContactName] = useState(userName);
  const [contactPhone, setContactPhone] = useState(userPhone ?? "");
  const [contactEmail, setContactEmail] = useState(userEmail);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!origin || !destination) {
      toast({ title: "Informe origem e destino", variant: "destructive" });
      return;
    }
    if (!contactName || !contactPhone || !contactEmail) {
      toast({ title: "Preencha os dados de contato", variant: "destructive" });
      return;
    }

    setLoading(true);

    const { error } = await supabase.from("agency_requests").insert({
      user_id: userId,
      origin: origin.toUpperCase(),
      destination: destination.toUpperCase(),
      travel_date: travelDate || null,
      return_date: returnDate || null,
      passengers: parseInt(passengers) || 1,
      cabin_class: cabinClass,
      flexible_dates: flexibleDates,
      notes: notes || null,
      contact_name: contactName,
      contact_phone: contactPhone,
      contact_email: contactEmail,
      status: "new",
    } as never);

    if (error) {
      toast({ title: "Erro ao enviar solicitação", description: error.message, variant: "destructive" });
      setLoading(false);
      return;
    }

    toast({ title: "Solicitação enviada! 🎉", description: "Nossa equipe entrará em contato em breve." });
    router.push("/agencia/confirmacao");
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      {/* Rota */}
      <div className="glass rounded-xl p-6 space-y-4">
        <h2 className="font-semibold text-white flex items-center gap-2">
          <Plane className="w-4 h-4 text-brand-gold" />
          Detalhes do voo
        </h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="origin">Origem (cidade ou IATA) *</Label>
            <Input id="origin" placeholder="GRU / São Paulo" value={origin} onChange={(e) => setOrigin(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="destination">Destino *</Label>
            <Input id="destination" placeholder="MIA / Miami" value={destination} onChange={(e) => setDestination(e.target.value)} required />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="travelDate">Data de ida</Label>
            <Input id="travelDate" type="date" value={travelDate} onChange={(e) => setTravelDate(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="returnDate">Data de volta</Label>
            <Input id="returnDate" type="date" value={returnDate} onChange={(e) => setReturnDate(e.target.value)} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="passengers">Passageiros</Label>
            <Input id="passengers" type="number" min="1" max="9" value={passengers} onChange={(e) => setPassengers(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Classe</Label>
            <Select value={cabinClass} onValueChange={setCabinClass}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="economy">Econômica</SelectItem>
                <SelectItem value="business">Executiva</SelectItem>
                <SelectItem value="any">Qualquer</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={flexibleDates}
            onChange={(e) => setFlexibleDates(e.target.checked)}
            className="w-4 h-4 accent-yellow-500 rounded"
          />
          <span className="text-sm text-muted-foreground">Tenho datas flexíveis (±3 dias)</span>
        </label>
        <div className="space-y-2">
          <Label htmlFor="notes">Observações adicionais</Label>
          <Textarea
            id="notes"
            placeholder="Programas de milhas que possui, preferências de assento, conexões, orçamento em milhas..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
          />
        </div>
      </div>

      {/* Contato */}
      <div className="glass rounded-xl p-6 space-y-4">
        <h2 className="font-semibold text-white">Seus dados de contato</h2>
        <div className="space-y-2">
          <Label htmlFor="contactName">Nome *</Label>
          <Input id="contactName" value={contactName} onChange={(e) => setContactName(e.target.value)} required />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="contactPhone">WhatsApp *</Label>
            <Input id="contactPhone" placeholder="+55 11 99999-9999" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="contactEmail">E-mail *</Label>
            <Input id="contactEmail" type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} required />
          </div>
        </div>
      </div>

      <Button type="submit" variant="gold" disabled={loading} className="w-full sm:w-auto">
        {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
        Enviar solicitação
      </Button>
    </form>
  );
}
