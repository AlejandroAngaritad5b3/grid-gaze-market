
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Mic, MicOff, MessageCircle, Square, Send, Zap } from "lucide-react";
import { useGeminiLiveAgent } from "@/hooks/useGeminiLiveAgent";

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url: string | null;
  category: string | null;
}

interface IntegratedAssistantProps {
  product: Product | null;
}

const IntegratedAssistant = ({ product }: IntegratedAssistantProps) => {
  const [textQuery, setTextQuery] = useState('');
  
  const {
    isListening,
    isProcessing,
    isSpeaking,
    transcript,
    conversation,
    startListening,
    stopListening,
    stopSpeaking,
    processTextQuery,
    clearConversation
  } = useGeminiLiveAgent(product);

  const handleTextSubmit = async () => {
    if (textQuery.trim()) {
      await processTextQuery(textQuery.trim());
      setTextQuery('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleTextSubmit();
    }
  };

  const toggleVoiceAgent = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  return (
    <Card className="bg-gradient-to-br from-purple-50 to-blue-50 border-purple-200 shadow-lg h-full">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center space-x-2 text-purple-800">
          <MessageCircle className="h-5 w-5" />
          <span>Asistente Integrado</span>
          <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full flex items-center">
            <Zap className="h-3 w-3 mr-1" />
            RAG + Gemini Live
          </span>
        </CardTitle>
        <div className="text-sm text-purple-600 space-y-1">
          <div>🎤 Voz → localhost:8502 (Gemini Live)</div>
          <div>💬 Texto → localhost:8501 (RAG Agent)</div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Controles de Voz */}
        <div className="flex items-center justify-center space-x-4">
          <Button
            onClick={toggleVoiceAgent}
            variant={isListening ? "destructive" : "default"}
            size="lg"
            className={`w-16 h-16 rounded-full ${
              isListening 
                ? "bg-red-500 hover:bg-red-600 animate-pulse" 
                : "bg-purple-600 hover:bg-purple-700"
            }`}
            disabled={isProcessing}
          >
            {isListening ? (
              <MicOff className="h-6 w-6" />
            ) : (
              <Mic className="h-6 w-6" />
            )}
          </Button>
          
          {isSpeaking && (
            <Button
              onClick={stopSpeaking}
              variant="outline"
              size="lg"
              className="bg-orange-500 hover:bg-orange-600 text-white"
            >
              <Square className="h-4 w-4 mr-2" />
              Stop
            </Button>
          )}
          
          <div className="text-center">
            <p className="text-sm font-medium text-gray-700">
              {isListening ? "Escuchando..." : 
               isProcessing ? "Procesando..." :
               isSpeaking ? "Hablando..." :
               "Presiona para hablar"}
            </p>
            <p className="text-xs text-gray-500">
              O escribe tu pregunta abajo
            </p>
          </div>
        </div>

        {/* Entrada de Texto */}
        <div className="space-y-2">
          <Textarea
            value={textQuery}
            onChange={(e) => setTextQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Pregunta sobre productos, precios, recomendaciones..."
            className="min-h-[80px] resize-none"
            disabled={isProcessing}
          />
          <Button
            onClick={handleTextSubmit}
            disabled={!textQuery.trim() || isProcessing}
            className="w-full"
          >
            <Send className="h-4 w-4 mr-2" />
            {isProcessing ? 'Enviando...' : 'Enviar a RAG Agent'}
          </Button>
        </div>

        {/* Transcripción Actual */}
        {transcript && (
          <div className="bg-white rounded-lg p-3 border border-purple-200">
            <p className="text-sm text-gray-700 italic">
              <span className="font-medium">Tú:</span> {transcript}
            </p>
          </div>
        )}

        {/* Historial de Conversación */}
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {conversation.map((message, index) => (
            <div
              key={index}
              className={`p-3 rounded-lg ${
                message.role === 'user'
                  ? 'bg-blue-100 border-l-4 border-blue-500'
                  : 'bg-green-100 border-l-4 border-green-500'
              }`}
            >
              <div className="flex items-start space-x-2">
                <span className="font-medium text-sm">
                  {message.role === 'user' ? 'Tú:' : 'Asistente:'}
                </span>
                <p className="text-sm text-gray-700 flex-1 whitespace-pre-line">
                  {message.content}
                </p>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {message.timestamp.toLocaleTimeString()}
              </p>
            </div>
          ))}
        </div>

        {/* Botón Limpiar */}
        {conversation.length > 0 && (
          <Button
            onClick={clearConversation}
            variant="outline"
            size="sm"
            className="w-full"
          >
            Limpiar Conversación
          </Button>
        )}

        {/* Estado del Sistema */}
        <div className="bg-white rounded-lg p-3 border border-purple-200">
          <p className="text-xs text-gray-600 mb-2">
            <strong>🤖 Estado del sistema:</strong>
          </p>
          <ul className="text-xs text-gray-600 space-y-1">
            <li>• <strong>Gemini Live (Voz):</strong> {isProcessing ? 'Procesando...' : 'Listo'}</li>
            <li>• <strong>RAG Agent (Texto):</strong> {isProcessing ? 'Consultando...' : 'Disponible'}</li>
            <li>• <strong>Micrófono:</strong> {isListening ? 'Grabando' : 'Disponible'}</li>
            <li>• <strong>Síntesis de voz:</strong> {isSpeaking ? 'Hablando' : 'Listo'}</li>
            <li>• <strong>Producto actual:</strong> {product ? product.name : 'Ninguno'}</li>
          </ul>
        </div>

        {/* Ejemplos de preguntas */}
        <div className="bg-white rounded-lg p-3 border border-purple-200">
          <p className="text-xs text-gray-600 mb-2">
            <strong>💡 Ejemplos de preguntas:</strong>
          </p>
          <ul className="text-xs text-gray-600 space-y-1">
            <li>• "¿Cuáles son las características de este producto?"</li>
            <li>• "¿Hay productos similares más baratos?"</li>
            <li>• "¿Qué ventajas tiene frente a la competencia?"</li>
            <li>• "¿Cuál es el precio de [producto específico]?"</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default IntegratedAssistant;
