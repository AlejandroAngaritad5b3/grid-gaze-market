
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, MessageCircle, Brain, Zap } from "lucide-react";
import { useGeminiVoiceAgent } from "@/hooks/useGeminiVoiceAgent";

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url: string | null;
  category: string | null;
}

interface VoiceAgentProps {
  product: Product | null;
}

const VoiceAgent = ({ product }: VoiceAgentProps) => {
  const {
    isListening,
    isConnected,
    transcript,
    conversation,
    startListening,
    stopListening,
    clearConversation
  } = useGeminiVoiceAgent(product);

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
          <span>Asistente IA Mejorado</span>
          {isConnected && (
            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full flex items-center">
              <Zap className="h-3 w-3 mr-1" />
              RAG Activo
            </span>
          )}
        </CardTitle>
        <div className="flex items-center space-x-2 text-sm text-purple-600">
          <Brain className="h-4 w-4" />
          <span>Con búsqueda inteligente y clasificación de intenciones</span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Microphone Control */}
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
            disabled={!isConnected}
          >
            {isListening ? (
              <MicOff className="h-6 w-6" />
            ) : (
              <Mic className="h-6 w-6" />
            )}
          </Button>
          <div className="text-center">
            <p className="text-sm font-medium text-gray-700">
              {isListening ? "Escuchando..." : "Presiona para hablar"}
            </p>
            <p className="text-xs text-gray-500">
              Pregunta, compara, recomienda
            </p>
          </div>
        </div>

        {/* Current Transcription */}
        {transcript && (
          <div className="bg-white rounded-lg p-3 border border-purple-200">
            <p className="text-sm text-gray-700 italic">
              <span className="font-medium">Tú:</span> {transcript}
            </p>
          </div>
        )}

        {/* Conversation History */}
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
                  {message.role === 'user' ? 'Tú:' : 'IA:'}
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

        {/* Clear Conversation Button */}
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

        {/* Enhanced Features Info */}
        <div className="bg-white rounded-lg p-3 border border-purple-200">
          <p className="text-xs text-gray-600 mb-2">
            <strong>🚀 Nuevas capacidades:</strong>
          </p>
          <ul className="text-xs text-gray-600 space-y-1">
            <li>• <strong>Comparaciones:</strong> "Compara este producto con..."</li>
            <li>• <strong>Recomendaciones:</strong> "¿Qué productos similares tienes?"</li>
            <li>• <strong>Búsqueda contextual:</strong> Encuentra productos relevantes</li>
            <li>• <strong>Clasificación de intenciones:</strong> Comprende mejor tus preguntas</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default VoiceAgent;
