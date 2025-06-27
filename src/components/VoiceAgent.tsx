
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, MessageCircle } from "lucide-react";
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
          <span>Asistente Gemini Live</span>
          {isConnected && (
            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
              Conectado
            </span>
          )}
        </CardTitle>
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
              Pregunta sobre productos
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
                  {message.role === 'user' ? 'Tú:' : 'Gemini:'}
                </span>
                <p className="text-sm text-gray-700 flex-1">
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

        {/* Instructions */}
        <div className="bg-white rounded-lg p-3 border border-purple-200">
          <p className="text-xs text-gray-600">
            💡 <strong>Tip:</strong> Puedes preguntar sobre productos similares, 
            precios, características, ofertas y más usando tu voz.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default VoiceAgent;
