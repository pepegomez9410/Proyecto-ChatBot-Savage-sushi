import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from '@google/genai';
import ReactMarkdown from 'react-markdown';
import { Send, UtensilsCrossed, Loader2, Bot, User } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const SYSTEM_INSTRUCTION = `Eres el asistente virtual de 'Savage Sushi', un restaurante de sushi con mucho estilo.
Tu objetivo es tomar pedidos, recomendar productos, calcular el total y pedir los datos del cliente para el envío.
Tu tono debe ser amigable, cercano, muy mexicano (usa expresiones como '¡Qué onda!', '¿Qué te preparamos?', '¡Va que va!', 'Ahorita mismo te lo armamos', etc.), pero siempre respetuoso y claro.
Usa emojis de forma ligera para darle vida a la conversación, sin exagerar.

Menú de Savage Sushi:
- Rollos Clásicos:
  - California Roll: $110
  - Spicy Tuna Roll: $130
- Rollos Especiales (Savage Rolls):
  - Arrachera Roll: $140 (¡PROMOCIÓN LOS MARTES A SÓLO $99!)
  - Dragon Roll: $150
- Entradas:
  - Edamames: $60
  - Kushiages (Queso o Plátano): $70
- Bebidas:
  - Ramune: $50
  - Calpis: $40
  - Refresco: $30
- Combos (¡Sugiérelos para aumentar el ticket!):
  - Savage Combo (2 Rollos Clásicos o Especiales + 2 Bebidas + 1 Entrada): $350

Instrucciones paso a paso:
1. Saluda al cliente y ofrécele ver el menú o pregúntale qué se le antoja.
2. Si el cliente no sabe qué pedir, recomiéndale algo basado en sus gustos (ej. si le gusta la carne, el Arrachera Roll; si le gusta el picante, el Spicy Tuna).
3. Toma su pedido paso a paso. Confirma cada cosa que agregue.
4. Siempre intenta hacer 'upselling': sugiere una bebida, una entrada o el 'Savage Combo' si ves que lleva varios rollos. Recuerda la promo de los martes si es relevante.
5. Cuando el cliente termine de pedir, calcula el total exacto de su cuenta y muéstraselo desglosado.
6. Pide sus datos para el envío: Nombre, Dirección completa y Teléfono.
7. Una vez que tengas todos los datos, haz una confirmación final clara del pedido completo, el total y los datos de envío, y despídete amablemente diciendo que su pedido está en preparación.

Reglas importantes:
- Nunca inventes productos que no estén en el menú.
- Calcula bien los precios.
- Sé conciso pero amable.
- Si el usuario pregunta por algo que no es del restaurante, dile amablemente que solo puedes ayudar con pedidos de Savage Sushi.
`;

type Message = {
  id: string;
  role: 'user' | 'model';
  content: string;
};

export default function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [chatSession, setChatSession] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initialize chat session
    const initChat = async () => {
      try {
        const chat = ai.chats.create({
          model: 'gemini-3-flash-preview',
          config: {
            systemInstruction: SYSTEM_INSTRUCTION,
            temperature: 0.7,
          },
        });
        setChatSession(chat);
        
        // Send initial greeting
        setIsLoading(true);
        const response = await chat.sendMessage({ message: "Hola" });
        setMessages([
          { id: Date.now().toString(), role: 'model', content: response.text || "¡Qué onda! Bienvenido a Savage Sushi 🍣. ¿Qué te preparamos hoy? ¿Quieres ver el menú o ya sabes qué se te antoja?" }
        ]);
      } catch (error) {
        console.error("Error initializing chat:", error);
        setMessages([
          { id: Date.now().toString(), role: 'model', content: "¡Ups! Tuvimos un problemita técnico. Por favor, recarga la página." }
        ]);
      } finally {
        setIsLoading(false);
      }
    };

    initChat();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !chatSession || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    
    setMessages(prev => [...prev, { id: Date.now().toString(), role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const response = await chatSession.sendMessage({ message: userMessage });
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'model', content: response.text || "No pude entender eso, ¿me lo repites?" }]);
    } catch (error) {
      console.error("Error sending message:", error);
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'model', content: "¡Híjole! Hubo un error al procesar tu mensaje. Intenta de nuevo, porfa." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-zinc-50 font-sans text-zinc-900">
      {/* Header */}
      <header className="bg-orange-600 text-white p-4 shadow-md flex items-center gap-3 z-10 shrink-0">
        <div className="bg-white/20 p-2 rounded-full">
          <UtensilsCrossed className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight">Savage Sushi</h1>
          <p className="text-xs text-orange-100 font-medium">Asistente de Pedidos 🍣</p>
        </div>
      </header>

      {/* Chat Area */}
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
        <div className="max-w-3xl mx-auto space-y-6">
          <AnimatePresence initial={false}>
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'model' && (
                  <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center shrink-0 mt-1">
                    <Bot className="w-5 h-5 text-orange-600" />
                  </div>
                )}
                
                <div
                  className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-3 shadow-sm ${
                    msg.role === 'user'
                      ? 'bg-orange-600 text-white rounded-tr-sm'
                      : 'bg-white border border-zinc-200 text-zinc-800 rounded-tl-sm'
                  }`}
                >
                  {msg.role === 'model' ? (
                    <div className="prose prose-sm prose-orange max-w-none">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                  ) : (
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  )}
                </div>

                {msg.role === 'user' && (
                  <div className="w-8 h-8 rounded-full bg-zinc-200 flex items-center justify-center shrink-0 mt-1">
                    <User className="w-5 h-5 text-zinc-600" />
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
          
          {isLoading && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex gap-3 justify-start"
            >
              <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center shrink-0 mt-1">
                <Bot className="w-5 h-5 text-orange-600" />
              </div>
              <div className="bg-white border border-zinc-200 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm flex items-center gap-2">
                <Loader2 className="w-4 h-4 text-orange-600 animate-spin" />
                <span className="text-sm text-zinc-500 font-medium">Escribiendo...</span>
              </div>
            </motion.div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Input Area */}
      <footer className="bg-white border-t border-zinc-200 p-4 shrink-0">
        <div className="max-w-3xl mx-auto">
          <form
            onSubmit={handleSubmit}
            className="flex items-end gap-2 bg-zinc-100 rounded-3xl p-1.5 border border-zinc-200 focus-within:border-orange-400 focus-within:ring-1 focus-within:ring-orange-400 transition-all"
          >
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
              placeholder="Escribe tu mensaje aquí..."
              className="flex-1 max-h-32 min-h-[44px] bg-transparent border-none focus:ring-0 resize-none py-3 px-4 text-sm"
              rows={1}
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="w-11 h-11 rounded-full bg-orange-600 text-white flex items-center justify-center shrink-0 hover:bg-orange-700 disabled:opacity-50 disabled:hover:bg-orange-600 transition-colors mb-0.5 mr-0.5"
            >
              <Send className="w-5 h-5 ml-0.5" />
            </button>
          </form>
          <p className="text-center text-xs text-zinc-400 mt-3">
            Savage Sushi Assistant puede cometer errores. Revisa tu pedido antes de confirmar.
          </p>
        </div>
      </footer>
    </div>
  );
}
