"use client";

import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  getConversation,
  getConversations,
  sendCoachMessage,
  deleteConversation,
  type CoachPriority,
  type SendCoachMessageInput,
} from "@/lib/api/ai-coach";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  priorities?: CoachPriority[];
  retryInput?: SendCoachMessageInput;
  isError?: boolean;
};

const suggestions = [
  {
    category: "Nutrition",
    title: "What should I eat next?",
    description: "Get ideas for your next meal.",
    prompt:
      "Based on my nutrition and dietary preferences, what should I eat for my next meal?",
    color: "bg-[#f8e8dd] text-[#a65c35]",
  },
  {
    category: "Habits",
    title: "Improve my consistency",
    description: "Build a routine that sticks.",
    prompt:
      "Help me improve my consistency with habits. Give me three practical actions to start today.",
    color: "bg-[#e9eddf] text-[#657447]",
  },
  {
    category: "Goals",
    title: "Review my progress",
    description: "Find my next best action.",
    prompt:
      "Help me review my progress toward my goals and suggest the most useful next action.",
    color: "bg-[#e9e5f3] text-[#7563a8]",
  },
  {
    category: "Wellness",
    title: "Create a daily routine",
    description: "Make a realistic daily plan.",
    prompt:
      "Help me create a realistic daily wellness routine that balances nutrition and healthy habits.",
    color: "bg-[#e5edf4] text-[#54769a]",
  },
];

function PriorityCard({ priority }: { priority: CoachPriority }) {
  const styles: Record<string, string> = {
    HABIT: "bg-[#e9eddf] text-[#657447]",
    NUTRITION: "bg-[#f8e8dd] text-[#a65c35]",
    GOAL: "bg-[#e9e5f3] text-[#7563a8]",
    GENERAL: "bg-[#e5edf4] text-[#54769a]",
  };

  return (
    <div className="rounded-xl border border-[#ebe7df] bg-white p-3">
      <div className="flex items-center gap-2">
        <span
          className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide ${styles[priority.type] ?? styles.GENERAL
            }`}
        >
          {priority.type}
        </span>
      </div>

      <p className="mt-2 text-sm font-semibold text-[#292820]">
        {priority.title}
      </p>

      <p className="mt-1 text-xs leading-5 text-[#77756f]">
        {priority.reason}
      </p>
    </div>
  );
}

function AssistantAvatar() {
  return (
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#f4773c] text-sm font-bold text-white">
      H
    </div>
  );
}

/**
 * Convert database messages into the format used by the chat UI.
 * Assistant messages are stored as JSON strings.
 */
function convertConversationMessage(message: {
  id: string;
  role: "USER" | "ASSISTANT";
  content: string;
}): ChatMessage {
  if (message.role === "USER") {
    return {
      id: message.id,
      role: "user",
      content: message.content,
    };
  }

  try {
    const parsed = JSON.parse(message.content);

    if (typeof parsed.message === "string") {
      return {
        id: message.id,
        role: "assistant",
        content: parsed.message,
        priorities: Array.isArray(parsed.priorities)
          ? parsed.priorities
          : [],
      };
    }
  } catch {
    // Support older assistant messages containing plain text.
  }

  return {
    id: message.id,
    role: "assistant",
    content: message.content,
  };
}

export default function AICoachPage() {
  const [input, setInput] = useState("");
  const [conversationId, setConversationId] = useState<string | undefined>();
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const queryClient = useQueryClient();

  // Fetch the user's conversation history.
  const {
    data: conversations = [],
    isLoading: isLoadingConversations,
  } = useQuery({
    queryKey: ["ai-coach", "conversations"],
    queryFn: getConversations,
  });

  // Fetch a selected conversation.
  const {
    data: selectedConversation,
    isLoading: isLoadingConversation,
  } = useQuery({
    queryKey: ["ai-coach", "conversation", conversationId],
    queryFn: () => getConversation(conversationId!),
    enabled: !!conversationId,
  });

  // Restore messages when a conversation is selected.
  useEffect(() => {
    if (!selectedConversation || !conversationId) return;

    setMessages(
      selectedConversation.messages.map(convertConversationMessage)
    );
  }, [selectedConversation, conversationId]);

  // Send a message to the AI Coach.
  const coachMutation = useMutation({
    mutationFn: sendCoachMessage,

    onSuccess: (result) => {
      setConversationId(result.conversationId);

      setMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: result.response.message,
          priorities: result.response.priorities ?? [],
        },
      ]);

      // Refresh conversation history.
      queryClient.invalidateQueries({
        queryKey: ["ai-coach", "conversations"],
      });
    },

    onError: (_error, variables) => {
      toast.error("The AI Coach couldn't respond. Please try again.");

      setMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content:
            "I couldn't generate a response just now. Please check your connection and try again.",
          isError: true,
          retryInput: variables,
        },
      ]);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteConversation,

    onSuccess: async (_, deletedId) => {
      await queryClient.invalidateQueries({
        queryKey: ["ai-coach", "conversations"],
      });

      queryClient.removeQueries({
        queryKey: ["ai-coach", "conversation", deletedId],
      });

      if (conversationId === deletedId) {
        setConversationId(undefined);
        setMessages([]);
        setInput("");
      }

      toast.success("Conversation deleted successfully.");
    },

    onError: () => {
      toast.error("Failed to delete conversation. Please try again.");
    },
  });

  // Automatically scroll to the latest message.
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, coachMutation.isPending]);

  function sendMessage(text: string) {
    const trimmed = text.trim();

    if (!trimmed || coachMutation.isPending) return;

    if (trimmed.length > 2000) {
      toast.error("Your message must be 2,000 characters or fewer.");
      return;
    }

    const request: SendCoachMessageInput = {
      message: trimmed,
      ...(conversationId ? { conversationId } : {}),
    };

    setMessages((current) => [
      ...current,
      {
        id: crypto.randomUUID(),
        role: "user",
        content: trimmed,
      },
    ]);

    setInput("");
    coachMutation.mutate(request);
  }

  function startNewConversation() {
    if (coachMutation.isPending) return;

    setConversationId(undefined);
    setMessages([]);
    setInput("");

    inputRef.current?.focus();
  }

  function openConversation(id: string) {
    if (coachMutation.isPending || id === conversationId) return;

    setMessages([]);
    setInput("");
    setConversationId(id);
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 pb-8">
      {/* Page heading */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-2 text-sm font-medium text-[#a16c4d]">
            YOUR PERSONAL WELLNESS ASSISTANT
          </p>

          <h1 className="text-3xl font-semibold tracking-tight text-[#292820] sm:text-4xl">
            AI Coach
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#77756f]">
            Get personalized guidance for your nutrition, habits, and goals.
            Small, consistent steps make a difference.
          </p>
        </div>

        <button
          type="button"
          onClick={startNewConversation}
          disabled={coachMutation.isPending}
          className="rounded-xl border border-[#e5e0d6] bg-[#fffdfa] px-4 py-2.5 text-sm font-medium text-[#45443d] transition hover:bg-[#f7f5f0] disabled:opacity-50"
        >
          + New conversation
        </button>
      </header>

      {/* Main layout */}
      <div className="grid items-start gap-6 lg:grid-cols-[230px_minmax(0,1fr)] xl:grid-cols-[230px_minmax(0,1fr)_280px]">

        {/* Conversation history */}
        <aside className="rounded-2xl border border-[#ebe7df] bg-[#fffdfa] p-4">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold text-[#292820]">
              Your conversations
            </h2>

            <span className="rounded-full bg-[#f7f5f0] px-2 py-1 text-xs text-[#77756f]">
              {conversations.length}
            </span>
          </div>

          <button
            type="button"
            onClick={startNewConversation}
            disabled={coachMutation.isPending}
            className="mb-3 w-full rounded-xl border border-dashed border-[#e5b99f] bg-[#fcf5ef] px-3 py-2.5 text-left text-sm font-medium text-[#a65c35] transition hover:bg-[#f8e8dd] disabled:opacity-50"
          >
            + Start a new conversation
          </button>

          {isLoadingConversations ? (
            <p className="py-4 text-center text-xs text-[#89867f]">
              Loading conversations...
            </p>
          ) : conversations.length === 0 ? (
            <p className="py-4 text-center text-xs leading-5 text-[#89867f]">
              Your conversations will appear here when you start chatting.
            </p>
          ) : (
            <div className="max-h-[420px] space-y-1 overflow-y-auto">
              {conversations.map((conversation) => {
                const isActive = conversation.id === conversationId;

                return (
                  <div
                    key={conversation.id}
                    className={`group flex items-center gap-1 rounded-xl transition ${isActive
                        ? "border border-[#f1d1bf] bg-[#fcf1e9]"
                        : "border border-transparent hover:bg-[#f7f5f0]"
                      }`}
                  >
                    <button
                      type="button"
                      onClick={() => openConversation(conversation.id)}
                      disabled={coachMutation.isPending || deleteMutation.isPending}
                      className="min-w-0 flex-1 px-3 py-3 text-left disabled:opacity-50"
                    >
                      <p className="truncate text-sm font-medium text-[#45443d]">
                        {conversation.title || "New conversation"}
                      </p>

                      <p className="mt-1 text-xs text-[#89867f]">
                        {conversation._count.messages}{" "}
                        {conversation._count.messages === 1 ? "message" : "messages"}
                      </p>
                    </button>

                    <button
                      type="button"
                      title="Delete conversation"
                      aria-label={`Delete ${conversation.title}`}
                      disabled={coachMutation.isPending || deleteMutation.isPending}
                      onClick={() => {
                        const confirmed = window.confirm(
                          `Delete "${conversation.title}"? This action cannot be undone.`
                        );

                        if (confirmed) {
                          deleteMutation.mutate(conversation.id);
                        }
                      }}
                      className="mr-2 rounded-lg p-2 text-[#aaa69d] opacity-100 transition hover:bg-[#f8e8dd] hover:text-[#b45e4a] sm:opacity-0 sm:group-hover:opacity-100 disabled:opacity-40"
                    >
                      ×
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </aside>

        {/* Chat panel */}
        <section className="flex min-h-[620px] flex-col overflow-hidden rounded-2xl border border-[#ebe7df] bg-[#fffdfa]">
          <div className="flex items-center gap-3 border-b border-[#ebe7df] px-5 py-4">
            <AssistantAvatar />

            <div className="min-w-0 flex-1">
              <p className="font-semibold text-[#292820]">HabitBot Coach</p>
              <p className="mt-0.5 text-xs text-[#89867f]">
                Nutrition · Habits · Goals
              </p>
            </div>

            <span className="rounded-full bg-[#e9eddf] px-3 py-1 text-xs font-medium text-[#657447]">
              AI assistant
            </span>
          </div>

          <div className="flex-1 space-y-5 p-4 sm:p-6">
            {isLoadingConversation && (
              <p className="py-8 text-center text-sm text-[#89867f]">
                Loading conversation...
              </p>
            )}

            {!isLoadingConversation && messages.length === 0 && (
              <div className="mx-auto max-w-lg py-8 text-center sm:py-12">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#f8e8dd] text-2xl">
                  ✦
                </div>

                <h2 className="mt-5 text-xl font-semibold text-[#292820]">
                  What would you like to work on?
                </h2>

                <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-[#77756f]">
                  Ask a question, get a practical recommendation, and take
                  the next step toward your goals.
                </p>

                <div className="mt-6 grid gap-3 text-left sm:grid-cols-2">
                  {suggestions.map((suggestion) => (
                    <button
                      key={suggestion.category}
                      type="button"
                      disabled={coachMutation.isPending}
                      onClick={() => sendMessage(suggestion.prompt)}
                      className="rounded-xl border border-[#ebe7df] bg-white p-4 text-left transition hover:border-[#e8b89e] hover:bg-[#fcfaf6] disabled:opacity-50"
                    >
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-semibold ${suggestion.color}`}
                      >
                        {suggestion.category}
                      </span>

                      <span className="mt-3 block text-sm font-semibold text-[#292820]">
                        {suggestion.title}
                      </span>

                      <span className="mt-1 block text-xs leading-5 text-[#77756f]">
                        {suggestion.description}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"
                  }`}
              >
                {message.role === "assistant" && <AssistantAvatar />}

                <div
                  className={`min-w-0 max-w-[88%] space-y-3 sm:max-w-[80%] ${message.role === "user" ? "items-end" : "items-start"
                    }`}
                >
                  <div
                    className={`rounded-2xl px-4 py-3 text-sm leading-7 ${message.role === "user"
                      ? "rounded-br-md bg-[#f4773c] text-white"
                      : "rounded-bl-md border border-[#ebe7df] bg-white text-[#45443d]"
                      }`}
                  >
                    <p className="whitespace-pre-wrap break-words">
                      {message.content}
                    </p>
                  </div>

                  {message.priorities && message.priorities.length > 0 && (
                    <div className="grid gap-2">
                      <p className="text-xs font-semibold uppercase tracking-wide text-[#89867f]">
                        Suggested priorities
                      </p>

                      {message.priorities.map((priority, index) => (
                        <PriorityCard
                          key={`${message.id}-${index}`}
                          priority={priority}
                        />
                      ))}
                    </div>
                  )}

                  {message.isError && message.retryInput && (
                    <button
                      type="button"
                      disabled={coachMutation.isPending}
                      onClick={() => coachMutation.mutate(message.retryInput!)}
                      className="text-xs font-semibold text-[#b45e4a] hover:underline disabled:opacity-50"
                    >
                      Retry response
                    </button>
                  )}
                </div>
              </div>
            ))}

            {coachMutation.isPending && (
              <div className="flex items-start gap-3">
                <AssistantAvatar />

                <div className="rounded-2xl rounded-bl-md border border-[#ebe7df] bg-white px-4 py-3">
                  <div className="flex items-center gap-2 text-sm text-[#77756f]">
                    <span className="h-2 w-2 animate-pulse rounded-full bg-[#f4773c]" />
                    Thinking through your question...
                  </div>
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          <form
            onSubmit={(event) => {
              event.preventDefault();
              sendMessage(input);
            }}
            className="border-t border-[#ebe7df] bg-[#fcfaf6] p-4 sm:p-5"
          >
            <div className="flex items-end gap-3 rounded-2xl border border-[#e5e0d6] bg-white p-2 focus-within:border-[#f4773c] focus-within:ring-2 focus-within:ring-[#f4773c]/10">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => {
                  if (
                    event.key === "Enter" &&
                    !event.shiftKey &&
                    !event.nativeEvent.isComposing
                  ) {
                    event.preventDefault();
                    sendMessage(input);
                  }
                }}
                maxLength={2000}
                rows={2}
                placeholder="Ask about nutrition, habits, or goals..."
                aria-label="Message the AI Coach"
                className="max-h-36 min-h-[48px] flex-1 resize-y bg-transparent px-3 py-2 text-sm leading-6 text-[#292820] outline-none placeholder:text-[#aaa69d]"
              />

              <button
                type="submit"
                disabled={!input.trim() || coachMutation.isPending}
                className="flex h-11 shrink-0 items-center justify-center rounded-xl bg-[#f4773c] px-4 text-sm font-semibold text-white transition hover:bg-[#e66b32] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {coachMutation.isPending ? "Sending..." : "Send"}
              </button>
            </div>

            <div className="mt-2 flex justify-between gap-3 px-1">
              <p className="text-xs text-[#89867f]">
                Enter to send · Shift + Enter for a new line
              </p>

              <p className="shrink-0 text-xs text-[#89867f]">
                {input.length}/2000
              </p>
            </div>
          </form>
        </section>

        {/* Information panel */}
        <aside className="space-y-4">
          <section className="rounded-2xl border border-[#ebe7df] bg-[#fffdfa] p-5">
            <h2 className="font-semibold text-[#292820]">
              How your coach helps
            </h2>

            <div className="mt-4 space-y-4">
              <div className="flex gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#f8e8dd] text-sm">
                  🍲
                </span>

                <div>
                  <p className="text-sm font-medium text-[#45443d]">
                    Nutrition guidance
                  </p>
                  <p className="mt-1 text-xs leading-5 text-[#77756f]">
                    Get meal ideas and practical ways to improve your diet.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#e9eddf] text-sm">
                  ✓
                </span>

                <div>
                  <p className="text-sm font-medium text-[#45443d]">
                    Better habits
                  </p>
                  <p className="mt-1 text-xs leading-5 text-[#77756f]">
                    Break goals into manageable daily actions.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#e9e5f3] text-sm">
                  ↗
                </span>

                <div>
                  <p className="text-sm font-medium text-[#45443d]">
                    Goal progress
                  </p>
                  <p className="mt-1 text-xs leading-5 text-[#77756f]">
                    Find useful next steps and stay consistent.
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-2xl bg-[#f7f5f0] p-5">
            <p className="text-sm font-semibold text-[#45443d]">
              Make it personal
            </p>

            <p className="mt-2 text-sm leading-6 text-[#77756f]">
              Ask specific questions and keep your habits, goals, and food
              logs up to date for more relevant guidance.
            </p>
          </section>

          <p className="px-1 text-xs leading-5 text-[#89867f]">
            AI responses can be inaccurate. Use nutrition guidance as a
            starting point, not a substitute for professional medical advice.
          </p>
        </aside>
      </div>
    </div>
  );
}